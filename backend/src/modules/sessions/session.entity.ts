import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SessionPhase } from '../../common/enums/session-phase.enum';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 8 })
  code!: string;

  @Column({ type: 'enum', enum: SessionPhase, default: SessionPhase.LOBBY })
  phase!: SessionPhase;

  @Column({ name: 'host_player_id', nullable: true, type: 'uuid' })
  hostPlayerId!: string | null;

  /** Active pack for the current stage — null before first vote resolves */
  @Column({ name: 'question_pack_id', nullable: true, type: 'text' })
  questionPackId!: string | null;

  /** Global question counter within the current stage (resets each stage) */
  @Column({ name: 'current_round_index', default: 0 })
  currentRoundIndex!: number;

  // ── Game settings ─────────────────────────────────────────────

  /** Number of category-vote stages in the game */
  @Column({ name: 'round_count', default: 3 })
  roundCount!: number;

  /** Questions played per stage */
  @Column({ name: 'questions_per_round', default: 5 })
  questionsPerRound!: number;

  /** Seconds per question */
  @Column({ name: 'question_duration', default: 20 })
  questionDuration!: number;

  /** Which stage we are currently on (0-based) */
  @Column({ name: 'current_stage_index', default: 0 })
  currentStageIndex!: number;

  /** JSON array of pack IDs that have already been played */
  @Column({ name: 'used_pack_ids', type: 'text', default: '[]' })
  usedPackIds!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
