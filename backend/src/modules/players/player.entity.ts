import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from '../sessions/session.entity';

@Entity('players')
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  name!: string;

  @Column({ length: 32 })
  color!: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'session_id' })
  sessionId!: string;

  @ManyToOne(() => Session, (session) => session.players)
  @JoinColumn({ name: 'session_id' })
  session!: Session;

  @Column({ name: 'reconnect_token', unique: true })
  reconnectToken!: string;

  @Column({ name: 'is_connected', default: false })
  isConnected!: boolean;

  @Column({ name: 'is_ready', default: false })
  isReady!: boolean;

  @Column({ default: 0 })
  score!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
