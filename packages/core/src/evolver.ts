// packages/core/src/evolver.ts
// F3 — self-evolution lineage. aetheros turns every failed run into the next
// skill revision. This module keeps the lineage ledger: each skill has immutable
// versions; experiments propose a new version; promotion promotes a candidate.
// Nothing here mutates history — versions are append-only.

export interface SkillVersion {
  version: number;
  spec: string;
  createdAt: string;
  promoted: boolean;
}

export interface Experiment {
  id: string;
  skill: string;
  fromVersion: number;
  candidate: string;
  baselineSpec: string;
  promoted: boolean;
  note?: string;
}

export class SkillLineage {
  private versions = new Map<string, SkillVersion[]>();
  private experiments: Experiment[] = [];

  /** Register the initial version of a skill (version 1). */
  seed(skill: string, spec: string, now = new Date()): SkillVersion {
    const list = this.versions.get(skill) ?? [];
    if (list.length > 0) throw new Error(`evolver: ${skill} already seeded`);
    const v: SkillVersion = { version: 1, spec, createdAt: now.toISOString(), promoted: true };
    list.push(v);
    this.versions.set(skill, list);
    return v;
  }

  /** Propose a new version from an experiment outcome. Append-only. */
  propose(skill: string, spec: string, now = new Date()): SkillVersion {
    const list = this.versions.get(skill);
    if (!list || list.length === 0) throw new Error(`evolver: ${skill} not seeded`);
    const next = list[list.length - 1]!.version + 1;
    const v: SkillVersion = { version: next, spec, createdAt: now.toISOString(), promoted: false };
    list.push(v);
    return v;
  }

  /** Promote a candidate version to the active promoted line. */
  promote(skill: string, version: number): SkillVersion {
    const list = this.versions.get(skill);
    if (!list) throw new Error(`evolver: ${skill} not seeded`);
    const target = list.find((v) => v.version === version);
    if (!target) throw new Error(`evolver: ${skill} v${version} not found`);
    for (const v of list) v.promoted = v.version === version;
    return target;
  }

  recordExperiment(exp: Omit<Experiment, 'promoted'> & { promoted?: boolean }): Experiment {
    const full: Experiment = { ...exp, promoted: exp.promoted ?? false };
    this.experiments.push(full);
    return full;
  }

  active(skill: string): SkillVersion | undefined {
    const list = this.versions.get(skill);
    if (!list) return undefined;
    return list.find((v) => v.promoted) ?? list[list.length - 1];
  }

  history(skill: string): readonly SkillVersion[] {
    return this.versions.get(skill) ?? [];
  }
}
