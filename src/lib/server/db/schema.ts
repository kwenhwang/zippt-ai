// Stub schema file for type compatibility
// zippt-ai does not use database - all data comes from api-catalog

export type User = {
	id: string;
	name?: string;
	email?: string;
} | undefined;
