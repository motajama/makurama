# Makurama

**Makurama** is a collection of changing video essays after Sei Shōnagon.

The project combines lo-fi video, Japanese minimalism, hardcoded PAL subtitles,
old iPod footage, chiptune sound, human voice, and a small open-source web apparatus.

The public website will live at:

https://www.janmotal.cz/makurama/

## Open-source art

Makurama treats the website as an artistic apparatus.

The videos may remain singular, fragile, and authored, but the frame around them is open:
readable code, modifiable structure, reusable interface, transparent decisions.

Open-source art here means not only using free tools, but refusing to hide the conditions
through which the work appears.

## Licensing

Source code, interface, CSS, JavaScript, Python tools, documentation, and JSON schema:
MIT License.

Videos, voice recordings, subtitles, images, artistic texts, and artistic metadata:
CC BY-NC-ND 4.0 unless stated otherwise.

## Structure

- `index.html` — main gallery
- `info.html` — project information page
- `assets/data/videos.json` — video metadata, tags, versions
- `assets/css/style.css` — visual system
- `assets/js/app.js` — gallery, filtering, video overlay
- `tools/` — video processing tools
- `docs/` — notes and documentation

## Video data

`assets/data/videos.json` is the content source for the static frontend. It contains:

- `site` — title, subtitle, intro quote, canonical base URL, and licensing note
- `tags` — stable tag ids with display labels and short descriptions
- `videos` — essay records with status, poster metadata, license, and version history

Video `status` should be one of `open`, `changing`, or `closed`. Version records carry the media path, date, duration, format, notes, transcript text, and subtitle path. Media files may be placeholders until the corresponding video assets exist.
