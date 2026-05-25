[![Source on GitHub](https://img.shields.io/badge/source-GitHub-111111?style=flat-square&logo=github)](https://github.com/motajama/makurama)
[![Code licensed MIT](https://img.shields.io/badge/code-MIT-111111?style=flat-square)](LICENSE)
[![Art licensed CC BY-NC-ND 4.0](https://img.shields.io/badge/art-CC%20BY--NC--ND%204.0-b11226?style=flat-square)](https://creativecommons.org/licenses/by-nc-nd/4.0/)
[![Open-source art](https://img.shields.io/badge/open--source-art-6f6f6f?style=flat-square)](https://github.com/motajama/makurama)

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

Source code, interface, CSS, JavaScript, documentation, and JSON schema:
MIT License.

Videos, voice recordings, subtitles, images, artistic texts, and artistic metadata:
CC BY-NC-ND 4.0 unless stated otherwise.

## Structure

- `index.html` — main gallery
- `info.html` — project information page
- `assets/data/videos.json` — video metadata, tags, versions
- `assets/css/style.css` — visual system
- `assets/js/app.js` — gallery, filtering, video overlay
- `docs/` — notes and documentation

## Video data

`assets/data/videos.json` is the content source for the static frontend. It contains:

- `site` — title, subtitle, intro quote, canonical base URL, and licensing note
- `tags` — stable tag ids with display labels and short descriptions
- `videos` — essay records with status, poster metadata, license, and version history

Video `status` should be one of `open`, `changing`, or `closed`. Version records carry the media path, date, duration, format, notes, transcript text, and subtitle path. Media files may be placeholders until the corresponding video assets exist.
