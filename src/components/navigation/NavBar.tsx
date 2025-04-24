// src/components/navigation/NavBar.tsx
"use client";

import { useGameStore } from "@/store/gameStore";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();
  const { activeTeams } = useGameStore();

  return (
    <nav className="fixed bottom-0 w-full bg-gray-900 p-4">
      <div className="flex justify-around max-w-md mx-auto">
        <Link
          href="/graficos"
          className={`flex flex-col items-center ${pathname === "/graficos" ? "text-green-500" : "text-gray-400"
            }`}
        >
          <svg

            className="w-6 h-6" stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="200px" width="200px" xmlns="http://www.w3.org/2000/svg"><path d="M90.52 390.06h38.497v16.583H65.443V390.06l31.933-28.182c2.852-2.578 4.96-5.098 6.328-7.56 1.368-2.46 2.05-5.018 2.05-7.675 0-4.1-1.386-7.402-4.16-9.902-2.733-2.5-6.386-3.75-10.956-3.75-3.516 0-7.363.763-11.543 2.286-4.18 1.485-8.652 3.71-13.418 6.68v-19.22c5.078-1.678 10.098-2.948 15.06-3.807 4.96-.9 9.823-1.35 14.588-1.35 10.47 0 18.594 2.306 24.375 6.915 5.82 4.61 8.73 11.035 8.73 19.277 0 4.766-1.23 9.22-3.69 13.36-2.46 4.1-7.637 9.61-15.528 16.523l-18.69 16.406m349.377 32.915c5.897 1.524 10.37 4.18 13.417 7.97 3.086 3.75 4.63 8.534 4.63 14.355 0 8.672-3.322 15.273-9.962 19.804-6.64 4.493-16.328 6.74-29.063 6.74-4.492 0-9.004-.372-13.535-1.115-4.492-.704-8.945-1.778-13.36-3.223v-17.403c4.22 2.11 8.4 3.71 12.54 4.805 4.18 1.054 8.28 1.58 12.304 1.58 5.978 0 10.548-1.034 13.712-3.104 3.203-2.07 4.805-5.04 4.805-8.907 0-3.985-1.64-6.993-4.922-9.024-3.242-2.07-8.047-3.105-14.414-3.106h-9.022v-14.53h9.492c5.664 0 9.883-.88 12.656-2.638 2.773-1.796 4.16-4.51 4.16-8.144 0-3.36-1.347-5.957-4.043-7.793-2.695-1.836-6.504-2.754-11.426-2.754-3.632 0-7.304.41-11.015 1.232-3.71.82-7.403 2.03-11.074 3.632V384.83c4.453-1.25 8.867-2.186 13.242-2.812 4.375-.624 8.672-.937 12.89-.937 11.368 0 19.864 1.876 25.49 5.626 5.663 3.71 8.495 9.316 8.495 16.816 0 5.118-1.348 9.317-4.043 12.598-2.696 3.242-6.68 5.527-11.953 6.856M236.062 230.74h19.922v-56.544l-20.45 4.22v-15.352l20.333-4.22h21.445v71.895h19.922v15.585h-61.172V230.74M496 496V352H352V128H176v160H16v208"></path></svg>
          <span className="text-xs mt-1">Graficos</span>
        </Link>
        <Link
          href="/estadisticas"
          className={`flex flex-col items-center ${pathname === "/estadisticas" ? "text-green-500" : "text-gray-400"
            }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xs mt-1">Estadísticas</span>
        </Link>
        <Link
          href="/armador"
          className={`flex flex-col items-center ${pathname === "/armador" ? "text-green-500" : "text-gray-400"
            }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="text-xs mt-1">Armador</span>
        </Link>
        {activeTeams?.waiting?.members && (
          <Link
            href="/anotador"
            className={`flex flex-col items-center ${pathname === "/anotador" ? "text-green-500" : "text-gray-400"
              }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span className="text-xs mt-1">Anotador</span>
          </Link>
        )}

        <Link
          href="/jugadores"
          className={`flex flex-col items-center ${pathname === "/jugadores" ? "text-green-500" : "text-gray-400"
            }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <span className="text-xs mt-1">Jugadores</span>
        </Link>
      </div>
    </nav>
  );
}
