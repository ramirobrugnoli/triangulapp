"use client";

import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";

interface CreatePlayerProps {
  onPlayerAdded?: () => void;
}

const CreatePlayer = ({ onPlayerAdded }: CreatePlayerProps) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const notify = () => toast("Jugador creado!");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage({ text: "El nombre es requerido", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error("Error al crear el jugador");
      }

      setName("");
      notify();

      // Refrescar la lista de jugadores
      if (onPlayerAdded) {
        onPlayerAdded();
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "Error al crear el jugador", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        autoClose={3000}
        position="top-right"
        theme="dark"
        closeOnClick={true}
      />
      <div className="p-4 bg-gray-900 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Agregar Jugador</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="Nombre del jugador"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md ${
              isLoading
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } transition-colors`}
          >
            {isLoading ? "Agregando..." : "Agregar Jugador"}
          </button>
        </form>
      </div>
    </>
  );
};

export default CreatePlayer;
