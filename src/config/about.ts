import about from "@data/content/about.json";

export interface TeamLink { label: string; url: string }
export interface TeamMember { id: string; name: string; role: string; photo: string; initials: string; bio: string; links: TeamLink[] }
export const ABOUT_ROOM = about.room;
export const ABOUT_STATS = about.stats;
export const ABOUT_TEAM: TeamMember[] = about.team;
export const ABOUT_VALUES = about.values;
export const ABOUT_CONTACT = about.contact;
