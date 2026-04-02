import { Session } from '../sessions/session.entity';
import { Player } from '../players/player.entity';
import { SessionSnapshot, PlayerSnapshot } from './realtime.types';

export function buildSessionSnapshot(
  session: Session,
  players: Player[],
  selfPlayerId: string,
): SessionSnapshot {
  const playerSnapshots: PlayerSnapshot[] = players.map((p) => ({
    playerId: p.id,
    name: p.name,
    color: p.color,
    avatarUrl: p.avatarUrl,
    isConnected: p.isConnected,
    isReady: p.isReady,
    score: p.score,
  }));

  return {
    sessionId: session.id,
    code: session.code,
    phase: session.phase,
    hostPlayerId: session.hostPlayerId,
    selfPlayerId,
    players: playerSnapshots,
    currentRound: null, // populated by gameplay module when active
  };
}
