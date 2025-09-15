# Audio Files Setup

## Current Audio Files (Downloaded)

### Voices (`client/public/audio/voices/`)
- `bravo.wav` ✅ - Bulgarian "Браво!"
- `try-again.wav` ✅ - Bulgarian "Опитай пак!"

### Animals (`client/public/audio/animals/`)
- `cat.mp3` ✅ - Cat sound (Home animals - index h)
- `chicken.mp3` ✅ - Chicken sound (Farm animals - index p)
- `crow.mp3` ✅ - Crow sound (Sky animals - index s)
- `dog.mp3` ✅ - Dog sound
- `elephant.mp3` ✅ - Elephant sound
- `lion.mp3` ✅ - Lion sound
- `monkey.mp3` ✅ - Monkey sound
- `tiger.mp3` ✅ - Tiger sound
- `wolf.mp3` ✅ - Wolf sound

### Vehicles (`client/public/audio/vehicles/`)
- `airplane.mp3` ✅ - Airplane sound
- `bus.mp3` ✅ - Bus sound (Road vehicles - index r)
- `firetruck.mp3` ✅ - Firetruck sound
- `train.mp3` ✅ - Train sound (Industrial vehicles - index i)
- `truck.mp3` ✅ - Truck horn sound

## Audio Configuration

The audio system is configured to use these files automatically. The mapping is:

- **Home animals (h)**: cat.mp3
- **Farm animals (p)**: chicken.mp3
- **Sky animals (s)**: crow.mp3
- **Road vehicles (r)**: bus.mp3
- **Industrial vehicles (i)**: train.mp3

## Additional Files Available

From the source repository, there are more audio files available if needed:
- Birds: dove, duck, falcon, robin, rooster, turkey
- More vehicles: firetruck, truck-horn
- Flowers: rose

## Testing

The audio files are now integrated and will play when:
- Player makes a correct choice (bravo voice + animal sound)
- Player makes an incorrect choice (try again voice)
- Items enter their slots (animal/vehicle sound)

## File Format
- Voices: WAV format
- Animals/Vehicles: MP3 format
- All files are optimized for web playback