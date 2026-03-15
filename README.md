# VibeCloud Frontend

## Project Description

VibeCloud is a cloud architecture discovery and design tool. It guides users through a conversational discovery process to collect project requirements, link GitHub repositories, and generate cloud architecture diagrams. The frontend provides an AI-assisted discovery chat, checklist-based progress tracking, and visualization of architecture options (including cost vs. performance trade-offs) and Terraform outputs.

## Group Members

- Laísa Rio
- Lucas Propopio
- Paulo Boccaletti

## Technologies Used

- **Vite** — Build tool and dev server
- **React 18** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **shadcn/ui** — UI components (Radix primitives)
- **TanStack Query** — Server state management
- **React Router** — Routing
- **ReactFlow** — Diagram visualization
- **ELK.js** — Graph layout
- **Recharts** — Charts
- **Zod** — Schema validation

## Setup / Installation

1. **Prerequisites**: Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions).

2. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd vibing-cloud-frontend
   ```

3. **Install dependencies**:
   ```sh
   npm install
   ```

## How to Run the Project

Start the development server:

```sh
npm run dev
```

The app will be available at `http://localhost:8080` (or the port shown in the terminal).

Other scripts:

- `npm run build` — Production build
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest tests

## How to Use the Project

1. **Start a new project**: On the home page, describe your project idea (e.g., name and summary). Submit to create a discovery project.

2. **Discovery phase**: Use the chat to answer questions about your project. The assistant collects context about objectives, target audience, tech stack, and more.

3. **Link GitHub repository**: Paste your GitHub repo URL in the "Repositório no GitHub" panel to enable architecture analysis.

4. **Architecture**: Once discovery is complete and the repo is linked, start the architecture analysis. View diagrams and choose between cost-optimized vs. performance-optimized options.

5. **Review & Terraform**: Review the architecture and access generated Terraform files for deployment.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
