# 🍽️ MealMesh

**Connect, Share & Enjoy Meals Together — Trustless, Transparent, Human-Verified**

MealMesh is a decentralized meal marketplace that reimagines social dining. Every user is World ID verified, every transaction is on-chain, and you control who you meet — not an algorithm.

## The Problem We're Solving

Social dining apps promise genuine human connection but deliver the opposite:

- **Timeleft**: Only Wednesdays, $20-40+ per dinner, algorithmic gatekeeping (you don't choose who you meet), zero proof users are real
- **EatWith**: $30-150+ per experience, host-curated only, feels like paying for a restaurant not making friends
- **All of them**: Centralized payment systems, opaque fees, fake profiles everywhere, no transparency

## MealMesh: Same Idea, But Trustless, Cheap, and Human-Verified

### 🌟 Our Advantages

#### 1. **Real Humans Only**
Every user is World ID verified — no bots, no fake profiles, no catfishing. This is something no competitor can guarantee. You know exactly who you're meeting.

#### 2. **Cost — This is Massive**
- Competitors: $20-150+ per meal
- **MealMesh: 0.001 WLD (~$0.001) platform fee**

Basically free. This single differentiator is everything for accessibility and market penetration.

#### 3. **Transparent On-Chain Payments**
Every transaction lives on the blockchain. You can verify every payment, audit the ledger, see exactly where money goes. No hidden platform cuts, no "we hold your money." Competitors have zero transparency here.

#### 4. **Instant In-App Communication**
World Chat integration means the moment you join a meal, you can directly message the host inside the app. Competitors make you wait for emails or navigate outside their platform. You get direct contact with verified humans.

#### 5. **No Algorithm Gatekeeping**
You browse meals freely and choose who to join. Timeleft controls matching via personality quiz — you have zero say. MealMesh puts control back in your hands.

### 💡 How It Works

#### 🍽️ **Host Meals**
1. **Create a Meal** — Specify restaurant, cuisine, date/time, max guests, location
2. **Blockchain Confirmation** — Transaction verified on Worldchain (0.001 WLD fee)
3. **Go Live** — Meal appears on the platform, searchable by location and cuisine
4. **Accept Guests** — Receive join requests, message them via World Chat
5. **Meet & Connect** — Host verified humans, build your dining community

#### 👥 **Join Meals**
1. **Browse Nearby** — Search all meals or filter by location (50km radius) and cuisine
2. **Pick a Meal** — View host profile, meal details, guest count, and availability
3. **Join with One Tap** — Blockchain transaction confirms your spot (0.001 WLD fee)
4. **Chat with Host** — Message opens instantly via World Chat integration
5. **Enjoy the Meal** — Meet verified humans, no fake profiles, no surprises

#### 🌍 **Core Features**
- **Real-Time Location Search** — Find meals near you using Haversine distance calculation
- **Smart Filtering** — Sort by closest, newest, or most available meals
- **Verified Profiles** — Every user World ID verified before joining
- **On-Chain Transparency** — All meals and transactions recorded on blockchain
- **Instant Messaging** — World Chat integration for seamless communication
- **Guest Management** — Hosts see join requests, can accept/manage guests
- **Mobile-First** — Optimized for World App on mobile devices

### 🔐 Technical Stack

- **Authentication**: NextAuth.js + Worldcoin MiniKit
- **Smart Contracts**: Solidity on Worldchain (verifiable meal creation & joining)
- **Distance Calculation**: Haversine formula (50km radius discovery)
- **Payments**: On-chain WLD transactions (0.001 WLD per action)
- **Communication**: World Chat integration (in-app messaging)
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Mini Apps UI Kit

### 📊 The Pitch

**"Social dining without the middleman. Every meal is verified by real humans, every transaction is transparent on-chain, and it costs almost nothing. Timeleft, EatWith, and others charge 100-1000x more while gatekeeping your choices and hiding their payment systems. We're keeping it simple: trustless, cheap, and human-verified."**

## The Broken Status Quo

Existing social dining apps promise genuine human connection but charge a premium:

- **Timeleft**: $20–40+ per dinner, algorithmic gatekeeping, zero proof users are real
- **EatWith**: $30–150+ per experience, host-curated only, feels like paying for a restaurant not making friends
- **Meal & Mates**: Similar pricing, same opacity, same trust issues

**The Problem**: These platforms take heavy cuts, hide their fee structures, and users have zero visibility into where money actually goes. You're overpaying just to meet strangers over food. Plus — no one can verify the users are actually real.

**MealMesh's Answer**: 0.001 WLD (~$0.001) platform fee. Transparent on-chain payments. Every user World ID verified. Control over who you meet. No gatekeeping. No hidden cuts.

## 📈 Market Opportunity

- **Global social dining market**: $10B+ and growing
- **Decentralized peer-to-peer platforms**: Growing 40% YoY
- **World ID adoption**: 10M+ verified users and growing rapidly
- **Low barrier to entry**: Minimal fees make adoption frictionless

The timing is perfect. Traditional apps have trained users to pay $20-150 per meal. MealMesh offers the same experience at 1/10,000th the cost. That's a 10,000x value improvement. At scale, even a tiny fee per transaction generates significant revenue while remaining accessible globally.

## 💰 Business Model

**Revenue Model:**
- **Platform fee**: 0.001 WLD per transaction (charged to both host & guest)
- **Scaling**: Revenue grows directly with meal volume
- **Unit economics**: Minimal infrastructure costs (blockchain-native, no payment processor cuts)

**Future Revenue Streams:**
- **Verified Host Badges**: Hosts pay small fee for "trusted" badge (increased bookings)
- **Analytics Dashboard**: Hosts get insights on guest preferences, booking patterns
- **Premium Listings**: Featured meal placement for premium pricing
- **Reputation NFTs**: Collectible badges for milestone meals hosted/joined

**Why This Works:**
1. Competitors take 20-40% cuts per transaction — MealMesh takes 0.001 WLD (essentially free)
2. At scale, even tiny fees add up (1M meals/month × 0.001 WLD = significant revenue)
3. Users save so much money they'll eagerly pay for premium features
4. On-chain transparency = users trust the model and adoption accelerates

## Getting Started

1. cp .env.example .env.local
2. Follow the instructions in the .env.local file
3. Run `npm run dev`
4. Run `ngrok http 3000`
5. Run `npx auth secret` to update the `AUTH_SECRET` in the .env.local file
6. Add your domain to the `allowedDevOrigins` in the next.config.ts file.
7. [For Testing] If you're using a proxy like ngrok, you need to update the `AUTH_URL` in the .env.local file to your ngrok url.
8. Continue to developer.worldcoin.org and make sure your app is connected to the right ngrok url
9. [Optional] For Verify and Send Transaction to work you need to do some more setup in the dev portal. The steps are outlined in the respective component files.

## Authentication

This starter kit uses [Minikit's](https://github.com/worldcoin/minikit-js) wallet auth to authenticate users, and [next-auth](https://authjs.dev/getting-started) to manage sessions.

## UI Library

This starter kit uses [Mini Apps UI Kit](https://github.com/worldcoin/mini-apps-ui-kit) to style the app. We recommend using the UI kit to make sure you are compliant with [World App's design system](https://docs.world.org/mini-apps/design/app-guidelines).

## Eruda

[Eruda](https://github.com/liriliri/eruda) is a tool that allows you to inspect the console while building as a mini app. You should disable this in production.

## Contributing

This template was made with help from the amazing [supercorp-ai](https://github.com/supercorp-ai) team.
