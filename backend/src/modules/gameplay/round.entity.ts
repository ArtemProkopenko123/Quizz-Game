import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Answer } from './answer.entity';

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id' })
  sessionId!: string;

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'session_id' })
  session!: Session;

  @Column({ name: 'round_index' })
  roundIndex!: number;

  @Column({ name: 'question_id' })
  questionId!: string;

  @Column({ name: 'deadline_at', type: 'timestamptz' })
  deadlineAt!: Date;

  @Column({ name: 'is_closed', default: false })
  isClosed!: boolean;

  @OneToMany(() => Answer, (answer) => answer.round)
  answers!: Answer[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
