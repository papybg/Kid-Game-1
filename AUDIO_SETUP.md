# Audio Files Setup

## Required Audio Files

Place the following audio files in the `client/public/audio/` directory:

### Voices (`client/public/audio/voices/`)
- `bravo.mp3` - Bulgarian "Браво!" recording
- `try-again.mp3` - Bulgarian "Опитай пак!" recording

### Animals (`client/public/audio/animals/`)
- `home.mp3` - Sound for home animals (h index)
- `farm.mp3` - Sound for farm animals (p index)
- `sky.mp3` - Sound for sky animals (s index)
- `road.mp3` - Sound for road vehicles (r index)
- `industrial.mp3` - Sound for industrial vehicles (i index)

### Vehicles (`client/public/audio/vehicles/`)
- Currently not used, but can be added for future vehicle sounds

## File Format
- Use MP3 format for best compatibility
- Keep files small (< 500KB each) for fast loading
- Record in Bulgarian for authentic experience

## Fallback
If audio files are missing or fail to load, the system will automatically fall back to tone-based sounds.

## Testing
After adding files, test in the browser console:
```javascript
// Test voice
playVoice('bravo')

// Test animal sound
playAnimalSound('h')
```