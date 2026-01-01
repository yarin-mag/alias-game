# 🎮 Alias Game - The Ultimate Multiplayer Party Experience

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PeerJS](https://img.shields.io/badge/PeerJS-FF0000?style=for-the-badge&logo=p2p&logoColor=white)](https://peerjs.com/)

Alias is a fast-paced multiplayer word game where players describe words to their teammates without using the word itself. Built with modern web technologies for a seamless, second-screen experience.

---

## ✨ Features

- **📱 Second Screen Gameplay**: Use your smartphone as a private controller while the "Game Board" is displayed on a host screen (TV/Laptop).
- **🔄 Real-time P2P Communication**: Powered by PeerJS for low-latency state synchronization.
- **📜 Smart Word Banks**: Curated word lists in both **Hebrew** and **English**.
- **🎯 Special Turns**: Landing on special board positions triggers a 5-card challenge with no time limit!
- **💾 State Persistence**: Never lose your progress—games survive host refreshes and reconnections.
- **🎨 Premium UI/UX**: Smooth animations with Framer Motion and a high-fidelity design system.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/yarin-mag/alias-game.git
   cd alias-game
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Run the development server**:
   ```sh
   npm run dev
   ```

4. **Access the application**:
   - Open `http://localhost:5173` to start a new game host.
   - Use the generated QR code or link to connect mobile controllers.

---

## 🛠 Tech Stack

- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, lucide-react (icons)
- **Animations**: Framer Motion
- **Networking**: PeerJS (WebRTC)
- **UI Components**: Radix UI / shadcn-ui
- **State Management**: React Hooks + LocalStorage Persistence

---

## 📖 How to Play

1. **Setup**: The Host starts the game and chooses the language (Hebrew/English).
2. **Connect**: Players scan the QR code to join as the **Blue** or **Red** team.
3. **Turn**: The active player receives words on their phone. Their goal is to explain as many as possible within the timer.
4. **Scoring**: 
   - `Correct`: +1 point
   - `Skip`: -1 point (if enabled)
   - `Opponent Guess`: If both teams fail to guess, the opponent can steal a point on the last word!
5. **Winner**: The first team to reach the center of the spiraling board wins!

---

## 🛠 Developer Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Locally preview production build |
| `npm run lint` | Run ESLint to verify code quality |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ for the ultimate party experience.