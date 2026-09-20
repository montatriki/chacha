Event covers and media for the Events room.

Covers are referenced from content/events.json (`cover`), e.g. /data/events/kreine-glow-kiss.jpg.
Until a file exists the card shows a branded Level Up placeholder.

To pull your Instagram posts, reels and story highlights, export them from your own account:
  Instagram app -> Settings -> Your activity -> Download your information (JSON)
then drop the images/videos in this folder and add them to each event's `media` list:
  { "type": "image", "src": "/data/events/kreine-glow-kiss-1.jpg" }
  { "type": "video", "src": "/data/events/kreine-glow-kiss-reel.mp4" }
