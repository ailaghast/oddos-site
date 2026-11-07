// OddTube's videos. Files live in trailer/ (made by _tools/trailer/record.js; swap in real ones any time).
// file: trailer/<file>.<ext> plus trailer/<file>-poster.png. ext: optional, webm if left out. thumb: art/tube/<thumb>.png (64x36, _tools/build-tube-thumbs.js). rating: 4 to 5, in halves. comment: optional, always
// from oddpixellabs. wishlist: show the Steam button; steam: its link if it isn't Dice Dice Battles'. native: the game's
// width in pixels for exact scaling (480 if left out; 0 = none). Keep sidebar titles to short words (the column is narrow).
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
  { id: 'cats', title: 'Cats vs. the odd pixel', file: 'cats', thumb: 'cats', len: '0:18', views: '9,001', rating: 5,
    added: 'October 12, 2026', desc: 'Two cats, one jar, one odd pixel. Filmed live in the lab.',
    comment: ['2 weeks ago', 'Day 3. No change.'] },
];
