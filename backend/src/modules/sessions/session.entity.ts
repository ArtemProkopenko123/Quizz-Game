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

  @Column({ name: 'question_pack_id' })
  questionPackId!: string;

  @Column({ name: 'current_round_index', default: 0 })
  currentRoundIndex!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
