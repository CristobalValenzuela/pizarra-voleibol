import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faRotateRight,
  faPlus,
  faTrash,
  faVolleyball,
  faTrophy,
  faXmark,
  faUserPlus,
  faFlagCheckered,
  faFolderOpen,
  faPencil,
  faEraser,
} from "@fortawesome/free-solid-svg-icons";
import logoRagnarok from "./assets/logo.png";

type Zone =
  | "Z1"
  | "Z2"
  | "Z3"
  | "Z4"
  | "Z5"
  | "Z6"
  | "Z7"
  | "Z8"
  | "Z9"
  | "BENCH";

interface Player {
  id: string;
  name: string;
  number: string;
  zone: Zone;
}

interface StatRecord {
  id: string;
  playerId: string;
  playerName: string;
  playerNumber: string;
  zone: Zone;
  category: "recepcion" | "saque" | "bloqueo" | "ataque" | "armado";
  symbol: string;
  timestamp: number;
}

interface MatchSession {
  id: string;
  matchName: string;
  players: Player[];
  stats: StatRecord[];
  updatedAt: number;
}

export default function App() {
  const [matches, setMatches] = useState<MatchSession[]>([]);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);

  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [matchName, setMatchName] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<StatRecord[]>([]);

  const [showNewMatchModal, setShowNewMatchModal] = useState<boolean>(false);
  const [tempMatchName, setTempMatchName] = useState<string>("");
  const [showPlayerModal, setShowPlayerModal] = useState<boolean>(false);

  const [playerName, setPlayerName] = useState<string>("");
  const [playerNumber, setPlayerNumber] = useState<string>("");
  const [playerZone, setPlayerZone] = useState<Zone>("Z1");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Estados para el lienzo de dibujo (Canvas) y selector de color
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>("#ffffff"); // Blanco por defecto
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Cargar lista de partidos guardados desde LocalStorage al iniciar
  useEffect(() => {
    const savedList = localStorage.getItem("volleyball_matches_list");
    if (savedList) {
      try {
        const parsed: MatchSession[] = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMatches(parsed);
        }
      } catch (e) {
        console.error("Error cargando lista de partidos:", e);
      }
    } else {
      const oldSaved = localStorage.getItem("volleyball_board_state");
      if (oldSaved) {
        try {
          const oldData = JSON.parse(oldSaved);
          if (oldData.matchName) {
            const migratedMatch: MatchSession = {
              id: Date.now().toString(),
              matchName: oldData.matchName,
              players: oldData.players || [],
              stats: oldData.stats || [],
              updatedAt: Date.now(),
            };
            setMatches([migratedMatch]);
            localStorage.setItem(
              "volleyball_matches_list",
              JSON.stringify([migratedMatch]),
            );
          }
        } catch (err) {
          console.error("Error migrando datos antiguos:", err);
        }
      }
    }
  }, []);

  // Guardar cambios automáticamente en el partido activo
  useEffect(() => {
    if (isStarted && currentMatchId) {
      const updatedMatches = matches.map((m) => {
        if (m.id === currentMatchId) {
          return {
            ...m,
            matchName,
            players,
            stats,
            updatedAt: Date.now(),
          };
        }
        return m;
      });
      setMatches(updatedMatches);
      localStorage.setItem(
        "volleyball_matches_list",
        JSON.stringify(updatedMatches),
      );
    }
  }, [matchName, players, stats, isStarted, currentMatchId]);

  // Ajustar tamaño del canvas cuando la sección cambia
  useEffect(() => {
    if (isStarted && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
  }, [isStarted]);

  // Funciones de dibujo en el Canvas
  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawingMode || !canvasRef.current) return;
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = brushColor; // Usa el color seleccionado (Blanco, Negro, Azul, Rojo)
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawingMode || !isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = brushColor; // Mantiene el color activo mientras arrastras
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingMode) return;
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempMatchName.trim()) return;

    const newMatch: MatchSession = {
      id: Date.now().toString(),
      matchName: tempMatchName.trim(),
      players: [],
      stats: [],
      updatedAt: Date.now(),
    };

    const updatedList = [newMatch, ...matches];
    setMatches(updatedList);
    localStorage.setItem(
      "volleyball_matches_list",
      JSON.stringify(updatedList),
    );

    setCurrentMatchId(newMatch.id);
    setMatchName(newMatch.matchName);
    setPlayers([]);
    setStats([]);
    setIsStarted(true);
    setShowNewMatchModal(false);
    setTempMatchName("");
  };

  const handleSelectMatch = (id: string) => {
    const selected = matches.find((m) => m.id === id);
    if (selected) {
      setCurrentMatchId(selected.id);
      setMatchName(selected.matchName);
      setPlayers(selected.players || []);
      setStats(selected.stats || []);
      setIsStarted(true);
    }
  };

  const handleDeleteMatchFromList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de eliminar este partido guardado?")) {
      const filtered = matches.filter((m) => m.id !== id);
      setMatches(filtered);
      localStorage.setItem("volleyball_matches_list", JSON.stringify(filtered));
      if (currentMatchId === id) {
        setIsStarted(false);
        setCurrentMatchId(null);
      }
    }
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const targetZone = playerZone;

    const updatedPlayers = players.map((p) => {
      if (targetZone !== "BENCH" && p.zone === targetZone) {
        return { ...p, zone: "BENCH" as Zone };
      }
      return p;
    });

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerName.trim(),
      number: playerNumber.trim() || "0",
      zone: targetZone,
    };

    const playersZone = players.filter((p) => p.zone == targetZone);
    if (playersZone.length > 0) {
      if (confirm("Ya hay un jugador en esta zona, desea reemplazarlo?")) {
        const playersNotZone = players.filter((p) => p.zone !== targetZone);
        setPlayers([...playersNotZone, newPlayer]);
        setPlayerName("");
        setPlayerNumber("");
        setShowPlayerModal(false);
      }
      return;
    }

    setPlayers([...updatedPlayers, newPlayer]);
    setPlayerName("");
    setPlayerNumber("");
    setShowPlayerModal(false);
  };

  const handleDeletePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleRotate = () => {
    const rotationMap: Record<Zone, Zone> = {
      Z1: "Z6",
      Z6: "Z5",
      Z5: "Z4",
      Z4: "Z3",
      Z3: "Z2",
      Z2: "Z1",
      BENCH: "BENCH",
      Z7: "Z7",
      Z8: "Z8",
      Z9: "Z9",
    };

    setPlayers(
      players.map((p) => {
        if (p.zone !== "BENCH") {
          return { ...p, zone: rotationMap[p.zone] };
        }
        return p;
      }),
    );
  };

  const handleAddStat = (
    category: "recepcion" | "saque" | "bloqueo" | "ataque" | "armado",
    symbol: string,
  ) => {
    const activePlayers = players.filter((p) => p.zone !== "BENCH");
    if (activePlayers.length === 0) {
      alert("Agrega jugadores a la cancha para registrar estadísticas.");
      return;
    }

    const targetPlayer =
      activePlayers.find((p) => p.id === selectedPlayerId) ||
      activePlayers.find((p) => p.zone === "Z1") ||
      activePlayers[0];

    const newStat: StatRecord = {
      id: Date.now().toString() + Math.random(),
      playerId: targetPlayer.id,
      playerName: targetPlayer.name,
      playerNumber: targetPlayer.number,
      zone: targetPlayer.zone,
      category,
      symbol,
      timestamp: Date.now(),
    };

    setStats([newStat, ...stats]);
  };

  const handleDeleteStat = (id: string) => {
    setStats(stats.filter((s) => s.id !== id));
  };

  const handleResetSession = () => {
    if (confirm("¿Estás seguro de salir al selector de partidos?")) {
      setIsStarted(false);
      setCurrentMatchId(null);
    }
  };

  const handleFinishMatch = () => {
    if (
      confirm(
        "¿Deseas finalizar el partido actual? Volverás al menú de partidos.",
      )
    ) {
      setIsStarted(false);
      setCurrentMatchId(null);
    }
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="bg-primary-600/20 text-primary-400 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faVolleyball} className="text-4xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-primary-400 text-center mb-1">
            RAGNAROK
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm text-center mb-6">
            Pizarra táctica digital y registro de estadísticas
          </p>

          <button
            onClick={() => setShowNewMatchModal(true)}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-lg shadow-primary-600/30 text-base mb-6"
          >
            <FontAwesomeIcon icon={faPlus} /> Nuevo Partido / Sesión
          </button>

          <div className="border-t border-slate-800 pt-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faFolderOpen} /> Partidos Guardados (
              {matches.length})
            </h2>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {matches.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4 italic">
                  No hay partidos guardados todavía. Crea uno nuevo para
                  comenzar.
                </p>
              ) : (
                matches.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMatch(m.id)}
                    className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-primary-500/50 p-3 rounded-xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <h3 className="text-sm font-bold text-slate-200 truncate group-hover:text-primary-300">
                        {m.matchName}
                      </h3>
                      <span className="text-[10px] text-slate-500">
                        {m.stats.length} registros •{" "}
                        {new Date(m.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteMatchFromList(e, m.id)}
                        className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg transition"
                        title="Eliminar partido"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {showNewMatchModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleCreateMatch}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-3 text-primary-300">
                Configurar Nueva Sesión
              </h2>
              <label className="block text-xs text-slate-400 mb-2">
                Nombre corto descriptivo (ej: vs Colo-Colo U18)
              </label>
              <input
                type="text"
                value={tempMatchName}
                onChange={(e) => setTempMatchName(e.target.value)}
                placeholder="Ej. Final Regional Curacaví"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm mb-6 focus:outline-none focus:border-primary-500"
                autoFocus
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewMatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-md"
                >
                  Iniciar Pizarra
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  const getPlayerAtZone = (zone: Zone) => players.find((p) => p.zone === zone);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none overflow-x-hidden">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 text-white font-black px-3 py-1.5 rounded-lg text-sm tracking-wider flex items-center gap-2 shrink-0">
            <FontAwesomeIcon icon={faVolleyball} /> RAGNAROK
          </div>
          <div className="truncate">
            <h1 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-wide truncate">
              {matchName}
            </h1>
            <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
              Pizarra Táctica Digital
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowPlayerModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition"
          >
            <FontAwesomeIcon icon={faUserPlus} />{" "}
            <span className="hidden xs:inline">Add Player</span>
          </button>

          <button
            onClick={handleFinishMatch}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition"
            title="Finalizar Partido"
          >
            <FontAwesomeIcon icon={faFlagCheckered} />
            <span className="hidden sm:inline">Finalizar</span>
          </button>

          <button
            onClick={handleResetSession}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1 transition"
            title="Volver al menú de partidos"
          >
            <FontAwesomeIcon icon={faFolderOpen} />
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-3 sm:p-4 flex flex-col lg:grid lg:grid-cols-12 gap-4">
        {/* SECCIÓN REGISTRO Y ESTADÍSTICAS */}
        <section className="flex-1 order-1 lg:order-2 lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 gap-2 flex-wrap">
            <h2 className="text-xs sm:text-sm font-bold text-primary-300 uppercase tracking-wider flex items-center gap-2">
              <FontAwesomeIcon icon={faTrophy} /> Estadísticas
            </h2>

            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold">
                Activo:
              </span>
              <select
                value={selectedPlayerId || ""}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="bg-slate-900 text-primary-300 font-bold border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                {players.filter((p) => p.zone !== "BENCH").length === 0 ? (
                  <option value="">Sin jugadores en cancha</option>
                ) : (
                  players
                    .filter((p) => p.zone !== "BENCH")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.number} {p.name} ({p.zone})
                      </option>
                    ))
                )}
              </select>
            </div>

            <span className="text-[10px] sm:text-xs text-slate-400">
              {stats.length} reg.
            </span>
          </div>

          {/* BOTONERA DE ESTADÍSTICAS */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2 bg-slate-950 p-2 sm:p-3 rounded-xl border border-slate-800">
            {/* RECEPCIÓN */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-center text-slate-400 truncate">
                RECEPCIÓN
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleAddStat("recepcion", "++")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  ++
                </button>
                <button
                  onClick={() => handleAddStat("recepcion", "+")}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  +
                </button>
                <button
                  onClick={() => handleAddStat("recepcion", "!")}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  !
                </button>
                <button
                  onClick={() => handleAddStat("recepcion", "-")}
                  className="bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  -
                </button>
              </div>
            </div>

            {/* ARMAR */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-center text-slate-400 truncate">
                ARMAR
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleAddStat("armado", "++")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  ++
                </button>
                <button
                  onClick={() => handleAddStat("armado", "+")}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  +
                </button>
                <button
                  onClick={() => handleAddStat("armado", "!")}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  !
                </button>
                <button
                  onClick={() => handleAddStat("armado", "=")}
                  className="bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  =
                </button>
              </div>
            </div>

            {/* SAQUE */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-center text-slate-400 truncate">
                SAQUE
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleAddStat("saque", "ACE")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-bold py-0.5 rounded"
                >
                  Ace
                </button>
                <button
                  onClick={() => handleAddStat("saque", "+")}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  +
                </button>
                <button
                  onClick={() => handleAddStat("saque", "!")}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  !
                </button>
                <button
                  onClick={() => handleAddStat("saque", "=")}
                  className="bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  =
                </button>
              </div>
            </div>

            {/* BLOQUEO */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-center text-slate-400 truncate">
                BLOQUEO
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleAddStat("bloqueo", "PUNT")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-bold py-0.5 rounded"
                >
                  Pto
                </button>
                <button
                  onClick={() => handleAddStat("bloqueo", "+")}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  +
                </button>
                <button
                  onClick={() => handleAddStat("bloqueo", "!")}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  !
                </button>
                <button
                  onClick={() => handleAddStat("bloqueo", "=")}
                  className="bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  =
                </button>
              </div>
            </div>

            {/* ATAQUE */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold text-center text-slate-400 truncate">
                ATAQUE
              </span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleAddStat("ataque", "KILL")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[8px] font-bold py-0.5 rounded"
                >
                  Kill
                </button>
                <button
                  onClick={() => handleAddStat("ataque", "+")}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  +
                </button>
                <button
                  onClick={() => handleAddStat("ataque", "!")}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  !
                </button>
                <button
                  onClick={() => handleAddStat("ataque", "=")}
                  className="bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold py-0.5 rounded"
                >
                  =
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-52 lg:max-h-none flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 sticky top-0 text-slate-400 uppercase text-[9px] sm:text-[10px]">
                <tr>
                  <th className="p-2">N° / Jugador</th>
                  <th className="p-2">Zona</th>
                  <th className="p-2">Categoría</th>
                  <th className="p-2 text-center">Acción</th>
                  <th className="p-2 text-right">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {stats.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-slate-600 italic text-xs"
                    >
                      No hay estadísticas registradas aún. Presiona los botones
                      superiores.
                    </td>
                  </tr>
                ) : (
                  stats.map((st) => (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-900/50 transition"
                    >
                      <td className="p-2 font-medium flex items-center gap-1.5">
                        <span className="bg-primary-900/60 text-primary-300 font-bold px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faUser}
                            className="text-[8px]"
                          />{" "}
                          #{st.playerNumber}
                        </span>
                        <span className="truncate max-w-[80px] sm:max-w-[120px]">
                          {st.playerName}
                        </span>
                      </td>
                      <td className="p-2 text-slate-400 font-semibold">
                        {st.zone}
                      </td>
                      <td className="p-2 capitalize text-slate-300">
                        {st.category}
                      </td>
                      <td className="p-2 text-center">
                        <span className="bg-slate-800 text-primary-400 font-bold px-2 py-0.5 rounded">
                          {st.symbol}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleDeleteStat(st.id)}
                          className="text-slate-600 hover:text-rose-400 p-1"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* LEYENDA COMPACTA */}
          <div className="mt-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[10px] text-slate-400 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="font-bold text-emerald-400">Punto:</span>
              <span className="text-slate-300">
                <strong>++</strong> Rec/Arm | <strong>Ace/Pto/Kill</strong> Pto
                | <strong>+</strong> Pos
              </span>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span className="font-bold text-amber-400">Cont:</span>
              <span className="text-slate-300">
                <strong>!</strong> Neutra
              </span>
            </div>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span className="font-bold text-rose-400">Error:</span>
              <span className="text-slate-300">
                <strong>-</strong> Mala | <strong>=</strong> Error Dir
              </span>
            </div>
          </div>
        </section>

        {/* SECCIÓN CANCHA TÁCTICA */}
        <section className="order-2 lg:order-1 lg:col-span-6 bg-[#d9ab63] border-4 border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
          {/* LIENZO DE DIBUJO (CANVAS) SOBRE LA CANCHA */}
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className={`absolute inset-0 z-20 w-full h-full touch-none ${
              isDrawingMode
                ? "cursor-crosshair pointer-events-auto"
                : "pointer-events-none"
            }`}
          />

          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-900/20 z-10 flex-wrap gap-2 z-30">
            <span className="text-slate-900/60 font-black text-[10px] sm:text-xs tracking-widest">
              CANCHA OFICIAL
            </span>

            {/* CONTROLES DE DIBUJO, SELECTOR DE COLOR Y LIMPIEZA */}
            <div className="flex items-center gap-1.5 z-30 flex-wrap">
              <button
                onClick={handleRotate}
                className="bg-amber-900/80 hover:bg-rose-900 text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow transition"
              >
                <FontAwesomeIcon icon={faRotateRight} />{" "}
                <span className="hidden sm:inline">Rotar</span>
              </button>
              <button
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow ${
                  isDrawingMode
                    ? "bg-amber-500 text-slate-950 ring-2 ring-white/50"
                    : "bg-slate-900/80 text-white hover:bg-slate-900"
                }`}
                title="Activar/Desactivar modo dibujo"
              >
                <FontAwesomeIcon icon={faPencil} />
                <span>{isDrawingMode ? "Dibujando..." : "Dibujar"}</span>
              </button>

              {/* SELECTOR DE COLOR (Visible solo al activar modo dibujo o siempre disponible) */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setBrushColor("#ffffff")}
                  className={`w-4 h-4 rounded-full bg-white transition ${brushColor === "#ffffff" ? "ring-2 ring-amber-400 scale-110" : "opacity-70"}`}
                  title="Blanco"
                />
                <button
                  onClick={() => setBrushColor("#000000")}
                  className={`w-4 h-4 rounded-full bg-black border border-slate-600 transition ${brushColor === "#000000" ? "ring-2 ring-amber-400 scale-110" : "opacity-70"}`}
                  title="Negro"
                />
                <button
                  onClick={() => setBrushColor("#2563eb")}
                  className={`w-4 h-4 rounded-full bg-blue-600 transition ${brushColor === "#2563eb" ? "ring-2 ring-amber-400 scale-110" : "opacity-70"}`}
                  title="Azul"
                />
                <button
                  onClick={() => setBrushColor("#dc2626")}
                  className={`w-4 h-4 rounded-full bg-red-600 transition ${brushColor === "#dc2626" ? "ring-2 ring-amber-400 scale-110" : "opacity-70"}`}
                  title="Rojo"
                />
              </div>

              <button
                onClick={handleClearCanvas}
                className="bg-rose-900/80 hover:bg-rose-900 text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow transition"
                title="Limpiar trazos"
              >
                <FontAwesomeIcon icon={faEraser} />
                <span>Limpiar</span>
              </button>

              <span className="bg-slate-900/40 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ml-1">
                RED / ATAQUE
              </span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-1 my-1 z-10">
            <div className="flex flex-col gap-1">
              {renderZoneBox("Z4", "(Del. Izq)", getPlayerAtZone("Z4"))}
              {renderZoneBox("Z7", "(Zag. Izq)", getPlayerAtZone("Z7"))}
              {renderZoneBox("Z5", "(Fond. Izq)", getPlayerAtZone("Z5"))}
            </div>

            <div className="flex flex-col gap-1">
              {renderZoneBox("Z3", "(Del. Centro)", getPlayerAtZone("Z3"))}
              {renderZoneBox("Z8", "(Zag. Centro)", getPlayerAtZone("Z8"))}
              {renderZoneBox("Z6", "(Zag. Centro)", getPlayerAtZone("Z6"))}
            </div>

            <div className="flex flex-col gap-1">
              {renderZoneBox("Z2", "(Del. Der)", getPlayerAtZone("Z2"))}
              {renderZoneBox("Z9", "(Zag. Der)", getPlayerAtZone("Z9"))}
              {renderZoneBox(
                "Z1",
                "Z1 (Saque/Zag. Der)",
                getPlayerAtZone("Z1"),
              )}
            </div>
          </div>

          {/* BANCA */}
          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-2.5 border border-slate-700/50 mt-2 z-10">
            <div className="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>
                BANCA / SUPLENTES (
                {players.filter((p) => p.zone === "BENCH").length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {players.filter((p) => p.zone === "BENCH").length === 0 ? (
                <span className="text-[11px] text-slate-500 italic">
                  No hay jugadores en la banca.
                </span>
              ) : (
                players
                  .filter((p) => p.zone === "BENCH")
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-xl text-[11px] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-purple-400 text-[9px]"
                        />
                        <span className="font-bold text-purple-400">
                          #{p.number}
                        </span>
                        <span className="truncate max-w-[70px]">{p.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <select
                          onChange={(e) => {
                            const targetZone = e.target.value as Zone;
                            const playerInTargetZone = players.find(
                              (pl) => pl.zone === targetZone,
                            );

                            setPlayers(
                              players.map((pl) => {
                                if (pl.id === p.id) {
                                  return { ...pl, zone: targetZone };
                                }
                                if (
                                  playerInTargetZone &&
                                  pl.id === playerInTargetZone.id
                                ) {
                                  return { ...pl, zone: "BENCH" };
                                }
                                return pl;
                              }),
                            );
                          }}
                          defaultValue=""
                          className="bg-slate-900 text-xs text-purple-300 border border-slate-600 rounded px-1 py-0.5 focus:outline-none"
                        >
                          <option value="" disabled>
                            Entrar a...
                          </option>
                          <option value="Z1">Z1</option>
                          <option value="Z2">Z2</option>
                          <option value="Z3">Z3</option>
                          <option value="Z4">Z4</option>
                          <option value="Z5">Z5</option>
                          <option value="Z6">Z6</option>
                        </select>

                        <button
                          onClick={() => handleDeletePlayer(p.id)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                          title="Eliminar jugador"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* LOGO DE FONDO EN LA CANCHA */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-40">
            <img
              src={logoRagnarok}
              alt="Logo Ragnarok"
              className="w-full h-auto object-contain"
            />
          </div>
        </section>
      </main>

      {/* MODAL AGREGAR JUGADOR */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAddPlayer}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-lg font-bold text-primary-300 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} /> Agregar Jugador / Posición
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Nombre del Jugador
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ej. Mateo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Número de Camiseta
                </label>
                <input
                  type="text"
                  value={playerNumber}
                  onChange={(e) => setPlayerNumber(e.target.value)}
                  placeholder="Ej. 10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Zona Asignada
                </label>
                <select
                  value={playerZone}
                  onChange={(e) => setPlayerZone(e.target.value as Zone)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="Z1">Zona 1 (Saque / Zag-Der)</option>
                  <option value="Z2">Zona 2 (Delantera-Der)</option>
                  <option value="Z3">Zona 3 (Delantera-Centro)</option>
                  <option value="Z4">Zona 4 (Delantera-Izq)</option>
                  <option value="Z5">Zona 5 (Zag-Izq)</option>
                  <option value="Z6">Zona 6 (Zag-Centro / Líbero)</option>
                  <option value="BENCH">Banca / Suplente</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPlayerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-md"
              >
                Guardar Jugador
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  function renderZoneBox(zoneCode: Zone, zoneLabel: string, player?: Player) {
    return (
      <div className="flex-1 bg-black/10 border-2 border-slate-900/30 rounded-xl p-2 flex flex-col justify-between relative min-h-[110px] sm:min-h-[130px] overflow-hidden">
        <div className="flex justify-between items-center text-[12px] font-bold text-white z-10">
          <span>{zoneCode}</span>
          <span className="truncate max-w-[70px] sm:max-w-[90px] ">
            {zoneLabel}
          </span>
        </div>

        <div className="flex items-center justify-center my-auto w-full z-10">
          {player ? (
            <div
              onClick={() => setSelectedPlayerId(player.id)}
              className={`bg-slate-900/90 text-white p-2 rounded-full border cursor-pointer transition relative ${
                selectedPlayerId === player.id
                  ? "border-amber-400 ring-2 ring-amber-400/50"
                  : "border-primary-500/50"
              } flex items-center justify-between gap-1.5 shadow-lg h-[60px] w-[60px]`}
            >
              <FontAwesomeIcon
                icon={faUser}
                className="text-[40px] shrink-0 m-auto !w-full"
              />
              <span className="bg-primary-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded w-fit m-auto leading-tight absolute bottom-[10px] left-0 right-0 text-center">
                #{player.number}
              </span>
              <span className="text-[10px] sm:text-xs font-bold truncate leading-tight mt-0.5 absolute bottom-[-15px] left-0 right-0 text-center">
                {player.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlayer(player.id);
                }}
                className="text-slate-400 hover:text-rose-400 px-0.5 shrink-0 font-bold absolute top-[-5px] right-[-15px]  bg-pink-500 rounded-full"
                title="Quitar de zona"
              >
                <FontAwesomeIcon icon={faXmark} className="text-white " />
              </button>
            </div>
          ) : (
            <span className="text-[10px] text-slate-900/40 italic">Vacío</span>
          )}
        </div>
      </div>
    );
  }
}
