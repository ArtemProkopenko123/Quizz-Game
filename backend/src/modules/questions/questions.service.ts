import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { QuestionPack } from './question-pack.types';

// __dirname resolves correctly in both local dev (src/) and Docker (dist/)
const PACKS_DIR = join(__dirname, '..', '..', '..', 'data', 'question-packs');

@Injectable()
export class QuestionsService implements OnModuleInit {
  private readonly logger = new Logger(QuestionsService.name);
  private readonly packs = new Map<string, QuestionPack>();

  async onModuleInit() {
    await this.loadPacks();
  }

  async loadPacks(): Promise<void> {
    const files = await readdir(PACKS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const raw = await readFile(join(PACKS_DIR, file), 'utf-8');
      const pack = JSON.parse(raw) as QuestionPack;
      this.validatePack(pack, file);
      this.packs.set(pack.id, pack);
      this.logger.log(`Loaded question pack: ${pack.id} (${pack.questions.length} questions)`);
    }
  }

  findPackById(packId: string): QuestionPack {
    const pack = this.packs.get(packId);
    if (!pack) throw new NotFoundException(`Question pack "${packId}" not found`);
    return pack;
  }

  listPacks(): Array<{ id: string; title: string; emoji: string; questionCount: number }> {
    return Array.from(this.packs.values()).map((p) => ({
      id: p.id,
      title: p.title,
      emoji: p.emoji ?? '❓',
      questionCount: p.questions.length,
    }));
  }

  private validatePack(pack: QuestionPack, filename: string): void {
    if (!pack.id || !pack.questions || !Array.isArray(pack.questions)) {
      throw new Error(`Invalid pack format in ${filename}`);
    }

    const seenIds = new Set<string>();
    for (const q of pack.questions) {
      if (!q.id) throw new Error(`Missing question id in ${filename}`);
      if (seenIds.has(q.id)) throw new Error(`Duplicate question id "${q.id}" in ${filename}`);
      seenIds.add(q.id);

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question "${q.id}" must have exactly 4 options in ${filename}`);
      }
      if (q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
        throw new Error(`Question "${q.id}" has invalid correctAnswerIndex in ${filename}`);
      }
    }
  }
}
