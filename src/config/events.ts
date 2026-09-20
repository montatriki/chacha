import events from "@data/content/events.json";

export interface EventLink { label: string; url: string }
export interface EventMedia { type: "image" | "video"; src: string; caption?: string }
export interface EventItem {
  id: string;
  title: string;
  client: string;
  category: string;
  date: string;
  cover: string;
  summary: string;
  details: string[];
  links: EventLink[];
  media: EventMedia[];
}
export const EVENT_ROOM = events.room;
export const EVENTS: EventItem[] = events.events as EventItem[];
