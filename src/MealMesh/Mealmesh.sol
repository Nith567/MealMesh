// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPermit2 {
  struct TokenPermissions { address token; uint256 amount; }
  struct PermitTransferFrom { TokenPermissions permitted; uint256 nonce; uint256 deadline; }
  struct SignatureTransferDetails { address to; uint256 requestedAmount; }
  function permitTransferFrom(
    PermitTransferFrom calldata permit,
    SignatureTransferDetails calldata transferDetails,
    address owner,
    bytes calldata signature
  ) external;
}

contract MealMesh {
  address public constant PERMIT2  = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
  address public constant WLD      = 0x2cFc85d8E48F8EAB294be644d9E25C3030863003;
  address public constant PLATFORM = 0x6121A6039a1Dc67a9dB8BDdD1dE3Bb2d3f9ED2B0;
  uint256 public constant FEE      = 1000000000000000; // 0.001 WLD

  struct Meal {
    address host;
    uint256 date;     // unix timestamp — used for auto reputation
    bool cancelled;
  }

  mapping(string => Meal) public meals;
  mapping(string => address[]) public mealGuests;
  mapping(string => mapping(address => bool)) public hasJoined;

  // reputation — incremented automatically on join, no confirm needed
  mapping(address => uint256) public mealsHosted;
  mapping(address => uint256) public mealsJoined;
  mapping(address => uint256) public mealsCancelled;

  event MealCreated(string mealId, address host, uint256 date);
  event MealJoined(string mealId, address guest);
  event MealCancelled(string mealId);

  // ── Create — host pays 0.001 WLD fee ────────────────────────────────────────
  function createMeal(
    string calldata mealId,
    uint256 date,
    IPermit2.PermitTransferFrom calldata permit,
    IPermit2.SignatureTransferDetails calldata transferDetails,
    bytes calldata signature
  ) external {
    require(meals[mealId].host == address(0), "Meal exists");
    require(date > block.timestamp, "Date must be future");
    require(transferDetails.requestedAmount == FEE, "Wrong fee");
    require(transferDetails.to == PLATFORM, "Wrong recipient");

    IPermit2(PERMIT2).permitTransferFrom(permit, transferDetails, msg.sender, signature);

    meals[mealId] = Meal({ host: msg.sender, date: date, cancelled: false });
    mealsHosted[msg.sender]++;

    emit MealCreated(mealId, msg.sender, date);
  }

  // ── Join — guest pays 0.001 WLD fee, reputation auto-tracked ────────────────
  function joinMeal(
    string calldata mealId,
    IPermit2.PermitTransferFrom calldata permit,
    IPermit2.SignatureTransferDetails calldata transferDetails,
    bytes calldata signature
  ) external {
    Meal storage meal = meals[mealId];
    require(meal.host != address(0), "Meal not found");
    require(!meal.cancelled, "Meal cancelled");
    require(block.timestamp < meal.date, "Meal already happened");
    require(!hasJoined[mealId][msg.sender], "Already joined");
    require(msg.sender != meal.host, "Host cant join");
    require(transferDetails.requestedAmount == FEE, "Wrong fee");
    require(transferDetails.to == PLATFORM, "Wrong recipient");

    IPermit2(PERMIT2).permitTransferFrom(permit, transferDetails, msg.sender, signature);

    hasJoined[mealId][msg.sender] = true;
    mealGuests[mealId].push(msg.sender);
    mealsJoined[msg.sender]++; // reputation on join, no confirm needed

    emit MealJoined(mealId, msg.sender);
  }

  // ── Cancel — host only, just kills the meal ──────────────────────────────────
  function cancelMeal(string calldata mealId) external {
    Meal storage meal = meals[mealId];
    require(msg.sender == meal.host, "Only host");
    require(!meal.cancelled, "Already cancelled");

    meal.cancelled = true;
    mealsCancelled[msg.sender]++;

    emit MealCancelled(mealId);
  }

  // ── Views ────────────────────────────────────────────────────────────────────
  function getReputation(address user) external view returns (
    uint256 joined, uint256 hosted, uint256 cancelled
  ) {
    return (mealsJoined[user], mealsHosted[user], mealsCancelled[user]);
  }

  function getGuests(string calldata mealId) external view returns (address[] memory) {
    return mealGuests[mealId];
  }

  function getMeal(string calldata mealId) external view returns (Meal memory) {
    return meals[mealId];
  }
}