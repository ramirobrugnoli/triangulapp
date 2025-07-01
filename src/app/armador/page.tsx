"use client";
import { TeamsBuilder } from "@/components/teamsbuilder/TeamsBuilder";
import { BalancingInfoModal } from "@/components/teamsbuilder/BalancingInfoModal";
import InfoIcon from "@/components/ui/icons/InfoIcon";
import { useState } from "react";

export default function AnotadorPage() {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <BalancingInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
        />
      <div className="flex flex-start items-center gap-4 align-middle"> 


      <h1 className="text-2xl font-bold">Armador de Equipos</h1>


      <div className="flex justify-center items-center space-x-3">
        <button 
          onClick={() => setIsInfoModalOpen(true)}
          className="text-gray-400 hover:text-white justify-center items-center flex m-0"
          aria-label="Información sobre el balanceo"
          >
          <InfoIcon className="w-6 h-6" />
        </button>
      </div>
          </div>

      <TeamsBuilder />
    </div>
  );
}
