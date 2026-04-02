import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Round } from './round.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'round_id' })
  roundId!: string;

  @ManyToOne(() => Round, (round) => round.answers)
  @JoinColumn({ name: 'round_id' })
  round!: Round;

  @Column({ name: 'player_id' })
  playerId!: string;

  @Column({ name: 'answer_index' })
  answerIndex!: number;

  @Column({ name: 'is_correct' })
  isCorrect!: boolean;

  @Column({ name: 'score_delta', default: 0 })
  scoreDelta!: number;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt!: Date;
}
