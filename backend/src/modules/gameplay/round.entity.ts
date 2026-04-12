import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('rounds')
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id' })
  sessionId!: string;

  @Column({ name: 'round_index' })
  roundIndex!: number;

  @Column({ name: 'question_id' })
  questionId!: string;

  @Column({ name: 'deadline_at', type: 'timestamptz' })
  deadlineAt!: Date;

  @Column({ name: 'is_closed', default: false })
  isClosed!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
