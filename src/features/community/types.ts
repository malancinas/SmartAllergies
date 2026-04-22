export interface CommunitySignalRow {
  user_id_hash: string;
  geohash: string;
  severity: number;
  created_at: string;
}

export interface CommunityAggregate {
  count: number;
  avgSeverity: number;
  geohash: string;
}
