// OddTube's videos. Files live in trailer/ (made by _tools/trailer/record.js; swap in real ones any time).
// file: trailer/<file>.<ext> plus trailer/<file>-poster.png. ext: optional, webm if left out. thumb: art/tube/<thumb>.png (64x36, _tools/build-tube-thumbs.js). rating: 4 to 5, in halves. comment: optional, always
// from oddpixellabs. wishlist: show the Steam button; steam: its link if it isn't Dice Dice Battles'. native: the game's
// width in pixels for exact scaling (480 if left out; 0 = none). Keep sidebar titles to short words (the column is narrow).
const STEAM_GLADIATORIA = 'https://store.steampowered.com/app/4506820/';
window.ODDTUBE = [
  { id: 'trailer', title: 'Dice Dice Battles - Official Trailer', file: 'ddb-trailer', ext: 'mp4', thumb: 'trailer', len: '1:15', views: '1,337', rating: 4.5,
    added: 'October 24, 2026', wishlist: true,
    desc: "Dice Dice Battles is a roguelike dice battler. Shop for strange dice, line them up, and unleash them on Fortuna's cursed dungeon. Or pit them against other players in async PvP. Coming to PC in 2027.",
    comment: ['1 day ago', 'Thanks for watching!'] },
  { id: 'reaction', title: 'FOOL REACTS to Rivals mode', file: 'reaction', thumb: 'reaction', len: '0:22', views: '4,096', rating: 4.5,
    added: 'October 29, 2026', wishlist: true, desc: 'The Fool has opinions about a Rivals run. Captions on, because the bells are loud.',
    comment: ['1 day ago', "He told us to pin this. OddTube doesn't have a pinning feature."] },
  { id: 'heroes', title: 'Meet the four champions', file: 'heroes', thumb: 'heroes', len: '0:21', views: '911', rating: 5,
    added: 'October 18, 2026', wishlist: true, desc: 'The Warden, the Witch, the Cutpurse and the Fool, in the order they agreed on.',
    comment: ['1 week ago', 'The Fool insisted on going last.'] },
  { id: 'oddoneout', title: 'Odd one out - any% speedrun', file: 'oddoneout', thumb: 'oddoneout', len: '0:12', views: '17', rating: 4,
    added: 'October 26, 2026', desc: 'A new world record, set on this very computer. Odd one out is in the Odd menu, if you want to try.',
    comment: ['5 hours ago', 'Verified. Nobody else has submitted a run.'] },
  // the real trailer: 1080p, but the camera zoom isn't a whole number, so no exact scale (native: 0)
  { id: 'gladiatoria', title: 'Gladiatoria - Official Trailer', file: 'gladiatoria-trailer', ext: 'mp4', native: 0, thumb: 'gladiatoria', len: '1:25', views: '79', rating: 5,
    added: 'October 30, 2026', wishlist: true, steam: STEAM_GLADIATORIA,
    desc: 'Your father is dead. His gladiator school is yours, and so are his debts. Buy, train and arm a stable of fighters, and lead them through brutal real-time arena battles. You have 60 days to reach Rome\'s Grand Games. Fail, and a senator takes everything.',
    comment: ['2 hours ago', 'Thumbs up or thumbs down?'] },
  { id: 'sixtydays', title: 'Gladiatoria - 60 days in 20 seconds', file: 'gladiatoria-60days', thumb: 'gladiatoria-60days', len: '0:20', views: '603', rating: 5,
    added: 'October 30, 2026', wishlist: true, steam: STEAM_GLADIATORIA, desc: 'One lanista, one school, one senator who wants his money. Sixty days, abridged.',
    comment: ['1 hour ago', 'The full version is 60 days long.'] },
  { id: 'ost', title: 'Gladiatoria OST - The Arena', file: 'gladiatoria-ost', thumb: 'gladiatoria-ost', len: '0:20', views: '612', rating: 5,
    added: 'October 30, 2026', wishlist: true, steam: STEAM_GLADIATORIA, desc: 'The music of the arena, from the Gladiatoria soundtrack. Best heard from the cheap seats.' },
  { id: 'cats', title: 'Cats vs. the odd pixel', file: 'cats', thumb: 'cats', len: '0:18', views: '9,001', rating: 5,
    added: 'October 12, 2026', desc: 'Two cats, one jar, one odd pixel. Filmed live in the lab.',
    comment: ['2 weeks ago', 'Day 3. No change.'] },
];
