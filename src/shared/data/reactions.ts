// shared/data/reactions.ts

export type ReactionId =
  | 'check'
  | 'thumbsup'
  | 'rocket'
  | 'heart'
  | 'smile1'
  | 'smile2'
  | 'smile3'
  | 'smile4'
  | 'smile5'
  | 'smile6'
  | 'smile7'
  | 'smile8'
  | 'smile9'
  | 'smile10'
  | 'smile11'
  | 'smile12'
  | 'smile13'
  | 'smile14'
  | 'smile15'
  | 'smile16'
  | 'smile17'
  | 'smile18'
  | 'smile19'
  | 'smile20'
  | 'smile21'
  | 'smile22'
  | 'smile23'
  | 'smile24'
  | 'smile25'
  | 'smile26'
  | 'smile27'
  | 'smile28'
  | 'smile29'
  | 'smile30'
  | 'smile31'
  | 'smile32'
  | 'smile33'
  | 'smile34'
  | 'smile35'
  | 'smile36'
  | 'smile37'
  | 'smile38'
  | 'smile39'
  | 'smile40'
  | 'smile41'
  | 'smile42'
  | 'smile43'
  | 'smile44'
  | 'smile45'
  | 'smile46'
  | 'smile47'
  | 'smile48'
  | 'smile49'
  | 'smile50'
  | 'smile51'
  | 'smile52'
  | 'smile53'
  | 'smile54'
  | 'smile55'
  | 'smile56'
  | 'smile57'
  | 'smile58'
  | 'smile59'
  | 'smile60'
  | 'smile61'
  | 'smile62'
  | 'smile63'
  | 'smile64'
  | 'smile65'
  | 'smile66'
  | 'smile67'
  | 'smile68'
  | 'smile69'
  | 'smile70'
  | 'smile71'
  | 'smile72'
  | 'smile73'
  | 'smile74'
  | 'smile75'
  | 'smile76'
  | 'smile77'
  | 'smile78'
  | 'smile79'
  | 'smile80'
  | 'smile81'
  | 'smile82'
  | 'smile83'
  | 'smile84'
  | 'smile85'
  | 'smile86'
  | 'smile87'
  | 'smile88'
  | 'smile89'
  | 'smile90'
  | 'smile91'
  | 'smile92'
  | 'smile93'
  | 'smile94'
  | 'smile95'
  | 'smile96'
  | 'smile97'
  | 'smile98'
  | 'smile99'
  | 'hand1'
  | 'hand2'
  | 'hand3'
  | 'hand4'
  | 'hand5'
  | 'hand6'
  | 'hand7'
  | 'hand8'
  | 'hand9'
  | 'hand10'
  | 'hand11'
  | 'hand12'
  | 'hand13'
  | 'hand14'
  | 'hand15'
  | 'hand16'
  | 'hand17'
  | 'hand18'
  | 'hand19'
  | 'hand20'
  | 'hand21'
  | 'hand22'
  | 'hand23'
  | 'hand24'
  | 'hand25'
  | 'hand26'
  | 'hand27'
  | 'hand28'
  | 'hand29'
  | 'hand30'
  | 'hand31'
  | 'hand32'
  | 'hand33'
  | 'person1'
  | 'person2'
  | 'person3'
  | 'person4'
  | 'person5'
  | 'person6'
  | 'person7'
  | 'person8'
  | 'person9'
  | 'person10'
  | 'person11'
  | 'person12'
  | 'person13'
  | 'person14'
  | 'person15'
  | 'person16'
  | 'person17'
  | 'person18'
  | 'person19'
  | 'person20'
  | 'person21'
  | 'person22'
  | 'person23'
  | 'person24'
  | 'person25'
  | 'person26'
  | 'person27'
  | 'person28'
  | 'person29'
  | 'persons1'
  | 'persons2'
  | 'persons3'
  | 'persons4'
  | 'persons5'
  | 'persons6'
  | 'persons7'
  | 'persons8'
  | 'persons9'
  | 'persons10'
  | 'persons11'
  | 'persons12'
  | 'persons13'
  | 'persons14'
  | 'persons15'
  | 'persons16'
  | 'persons17'
  | 'persons18'
  | 'persons19'
  | 'persons20'
  | 'persons21'
  | 'persons22'
  | 'persons23'
  | 'persons24'
  | 'persons25'
  | 'persons26'
  | 'persons27'
  | 'persons28'
  | 'persons29'
  | 'persons30'
  | 'persons31'
  | 'persons32'
  | 'persons33'
  | 'persons34'
  | 'transport1'
  | 'transport2'
  | 'transport3'
  | 'transport4'
  | 'transport5'
  | 'transport6'
  | 'transport7'
  | 'transport8'
  | 'transport9'
  | 'transport10'
  | 'transport11'
  | 'transport12'
  | 'transport13'
  | 'transport14'
  | 'transport15'
  | 'transport16'
  | 'transport17'
  | 'transport18'
  | 'transport19'
  | 'transport20'
  | 'transport21'
  | 'transport22'
  | 'transport23'
  | 'transport24'
  | 'transport25'
  | 'transport26'
  | 'transport27'
  | 'transport28'
  | 'transport29'
  | 'transport30'
  | 'transport31'
  | 'transport32'
  | 'transport33'
  | 'transport34'
  | 'transport35'
  | 'transport36'
  | 'transport37'
  | 'transport38'
  | 'transport39'
  | 'transport40'
  | 'transport41'
  | 'transport42'
  | 'transport43'
  | 'transport44'
  | 'transport45'
  | 'transport46'
  | 'transport47'
  | 'transport48'
  | 'transport49'
  | 'transport50'
  | 'transport51'
  | 'transport52'
  | 'transport53'
  | 'transport54'
  | 'transport55'
  | 'heart1'
  | 'heart2'
  | 'heart3'
  | 'heart4'
  | 'heart5'
  | 'heart6'
  | 'heart7'
  | 'heart8'
  | 'heart9'
  | 'heart10'
  | 'heart11'
  | 'heart12'
  | 'heart13'
  | 'heart14'
  | 'heart15'
  | 'heart16'
  | 'heart17'
  | 'heart18'
  | 'heart19'
  | 'object1'
  | 'object2'
  | 'object3'
  | 'object4'
  | 'object5'
  | 'object6'
  | 'object7'
  | 'object8'
  | 'object9'
  | 'object10'
  | 'object11'
  | 'object12'
  | 'object13'
  | 'object14'
  | 'object15'
  | 'object16'
  | 'object17'
  | 'object18'
  | 'object19'
  | 'object20'
  | 'object21'
  | 'object22'
  | 'object23'
  | 'object24'
  | 'object25'
  | 'object26'
  | 'object27'
  | 'object28'
  | 'object29'
  | 'object30'
  | 'object31'
  | 'object32'
  | 'object33'
  | 'object34'
  | 'object35'
  | 'object36'
  | 'object37'
  | 'object38'
  | 'object39'
  | 'object40'
  | 'object41'
  | 'object42'
  | 'object43'
  | 'object44'
  | 'object45'
  | 'object46'
  | 'object47'
  | 'object48'
  | 'object49'
  | 'object50'
  | 'object51'
  | 'object52'
  | 'object53'
  | 'object54'
  | 'object55'
  | 'object56'
  | 'object57'
  | 'object58'
  | 'object59'
  | 'object60'
  | 'object61'
;

export interface ReactionDef {
  id: ReactionId;
  icon: string;
  isEmoji: boolean;
}

export const reactionDefs: readonly ReactionDef[] = [
  { id: 'check', icon: '✅', isEmoji: true },
  { id: 'thumbsup', icon: '👍', isEmoji: true },

  // Emoji-Reactions für die Palette
  { id: 'smile1', icon: '😀', isEmoji: true },
  { id: 'smile2', icon: '😃', isEmoji: true },
  { id: 'smile3', icon: '😄', isEmoji: true },
  { id: 'smile4', icon: '😁', isEmoji: true },
  { id: 'smile5', icon: '😆', isEmoji: true },
  { id: 'smile6', icon: '😅', isEmoji: true },
  { id: 'smile7', icon: '😂', isEmoji: true },
  { id: 'smile8', icon: '🤣', isEmoji: true },
  { id: 'smile9', icon: '☺️', isEmoji: true },
  { id: 'smile10', icon: '😊', isEmoji: true },
  { id: 'smile11', icon: '😇', isEmoji: true },
  { id: 'smile12', icon: '🙂', isEmoji: true },
  { id: 'smile13', icon: '🙃', isEmoji: true },
  { id: 'smile14', icon: '😉', isEmoji: true },
  { id: 'smile15', icon: '😌', isEmoji: true },
  { id: 'smile16', icon: '😍', isEmoji: true },
  { id: 'smile17', icon: '😘', isEmoji: true },
  { id: 'smile18', icon: '😗', isEmoji: true },
  { id: 'smile19', icon: '😙', isEmoji: true },
  { id: 'smile20', icon: '😚', isEmoji: true },
  { id: 'smile21', icon: '😋', isEmoji: true },
  { id: 'smile22', icon: '😜', isEmoji: true },
  { id: 'smile23', icon: '😝', isEmoji: true },
  { id: 'smile24', icon: '😛', isEmoji: true },
  { id: 'smile25', icon: '🤑', isEmoji: true },
  { id: 'smile26', icon: '🤗', isEmoji: true },
  { id: 'smile27', icon: '🤓', isEmoji: true },
  { id: 'smile28', icon: '😎', isEmoji: true },
  { id: 'smile29', icon: '🤡', isEmoji: true },
  { id: 'smile30', icon: '🤠', isEmoji: true },
  { id: 'smile31', icon: '😏', isEmoji: true },
  { id: 'smile32', icon: '😒', isEmoji: true },
  { id: 'smile33', icon: '😞', isEmoji: true },
  { id: 'smile34', icon: '😔', isEmoji: true },
  { id: 'smile35', icon: '😟', isEmoji: true },
  { id: 'smile36', icon: '😕', isEmoji: true },
  { id: 'smile37', icon: '🙁', isEmoji: true },
  { id: 'smile38', icon: '☹️', isEmoji: true },
  { id: 'smile39', icon: '😣', isEmoji: true },
  { id: 'smile40', icon: '😖', isEmoji: true },
  { id: 'smile41', icon: '😫', isEmoji: true },
  { id: 'smile42', icon: '😩', isEmoji: true },
  { id: 'smile43', icon: '😤', isEmoji: true },
  { id: 'smile44', icon: '😠', isEmoji: true },
  { id: 'smile45', icon: '😡', isEmoji: true },
  { id: 'smile46', icon: '😶', isEmoji: true },
  { id: 'smile47', icon: '😐', isEmoji: true },
  { id: 'smile48', icon: '😑', isEmoji: true },
  { id: 'smile49', icon: '😯', isEmoji: true },
  { id: 'smile50', icon: '😦', isEmoji: true },
  { id: 'smile51', icon: '😧', isEmoji: true },
  { id: 'smile52', icon: '😮', isEmoji: true },
  { id: 'smile53', icon: '😲', isEmoji: true },
  { id: 'smile54', icon: '😵', isEmoji: true },
  { id: 'smile55', icon: '😳', isEmoji: true },
  { id: 'smile56', icon: '😱', isEmoji: true },
  { id: 'smile57', icon: '😨', isEmoji: true },
  { id: 'smile58', icon: '😰', isEmoji: true },
  { id: 'smile59', icon: '😢', isEmoji: true },
  { id: 'smile60', icon: '😥', isEmoji: true },
  { id: 'smile61', icon: '🤤', isEmoji: true },
  { id: 'smile62', icon: '😭', isEmoji: true },
  { id: 'smile63', icon: '😓', isEmoji: true },
  { id: 'smile64', icon: '😪', isEmoji: true },
  { id: 'smile65', icon: '😴', isEmoji: true },
  { id: 'smile66', icon: '🙄', isEmoji: true },
  { id: 'smile67', icon: '🤔', isEmoji: true },
  { id: 'smile68', icon: '🤥', isEmoji: true },
  { id: 'smile69', icon: '😬', isEmoji: true },
  { id: 'smile70', icon: '🤐', isEmoji: true },
  { id: 'smile71', icon: '🤢', isEmoji: true },
  { id: 'smile72', icon: '🤮', isEmoji: true },
  { id: 'smile73', icon: '🤧', isEmoji: true },
  { id: 'smile74', icon: '😷', isEmoji: true },
  { id: 'smile75', icon: '🤒', isEmoji: true },
  { id: 'smile76', icon: '🤕', isEmoji: true },
  { id: 'smile77', icon: '🤨', isEmoji: true },
  { id: 'smile78', icon: '🤩', isEmoji: true },
  { id: 'smile79', icon: '🤯', isEmoji: true },
  { id: 'smile80', icon: '🧐', isEmoji: true },
  { id: 'smile81', icon: '🤫', isEmoji: true },
  { id: 'smile82', icon: '🤪', isEmoji: true },
  { id: 'smile83', icon: '🥺', isEmoji: true },
  { id: 'smile84', icon: '🤭', isEmoji: true },
  { id: 'smile85', icon: '🥱', isEmoji: true },
  { id: 'smile86', icon: '🥳', isEmoji: true },
  { id: 'smile87', icon: '🥴', isEmoji: true },
  { id: 'smile88', icon: '🥶', isEmoji: true },
  { id: 'smile89', icon: '🥲', isEmoji: true },
  { id: 'smile90', icon: '🫤', isEmoji: true },
  { id: 'smile91', icon: '🫢', isEmoji: true },
  { id: 'smile92', icon: '🫣', isEmoji: true },
  { id: 'smile93', icon: '🫡', isEmoji: true },
  { id: 'smile94', icon: '🥹', isEmoji: true },
  { id: 'smile95', icon: '😈', isEmoji: true },
  { id: 'smile96', icon: '👿', isEmoji: true },
  { id: 'smile97', icon: '🤬', isEmoji: true },
  { id: 'smile98', icon: '💩', isEmoji: true },
  { id: 'smile99', icon: '💀', isEmoji: true },
  { id: 'hand1', icon: '👐', isEmoji: true },
  { id: 'hand2', icon: '🙌', isEmoji: true },
  { id: 'hand3', icon: '👏', isEmoji: true },
  { id: 'hand4', icon: '🙏', isEmoji: true },
  { id: 'hand5', icon: '🤝', isEmoji: true },
  { id: 'hand6', icon: '👎', isEmoji: true },
  { id: 'hand7', icon: '👊', isEmoji: true },
  { id: 'hand8', icon: '✊', isEmoji: true },
  { id: 'hand9', icon: '🤛', isEmoji: true },
  { id: 'hand10', icon: '🤜', isEmoji: true },
  { id: 'hand11', icon: '🤞', isEmoji: true },
  { id: 'hand12', icon: '✌️', isEmoji: true },
  { id: 'hand13', icon: '🤘', isEmoji: true },
  { id: 'hand14', icon: '👌', isEmoji: true },
  { id: 'hand15', icon: '👈', isEmoji: true },
  { id: 'hand16', icon: '👉', isEmoji: true },
  { id: 'hand17', icon: '👆', isEmoji: true },
  { id: 'hand18', icon: '👇', isEmoji: true },
  { id: 'hand19', icon: '☝️', isEmoji: true },
  { id: 'hand20', icon: '✋', isEmoji: true },
  { id: 'hand21', icon: '🤚', isEmoji: true },
  { id: 'hand22', icon: '🖐️', isEmoji: true },
  { id: 'hand23', icon: '🖖', isEmoji: true },
  { id: 'hand24', icon: '👋', isEmoji: true },
  { id: 'hand25', icon: '🤙', isEmoji: true },
  { id: 'hand26', icon: '💪', isEmoji: true },
  { id: 'hand27', icon: '🖕', isEmoji: true },
  { id: 'hand28', icon: '🤟', isEmoji: true },
  { id: 'hand29', icon: '🤲', isEmoji: true },
  { id: 'hand30', icon: '✍️', isEmoji: true },
  { id: 'hand31', icon: '🤳', isEmoji: true },
  { id: 'hand32', icon: '💅', isEmoji: true },
  { id: 'hand33', icon: '🖖', isEmoji: true },
  { id: 'person1', icon: '💁', isEmoji: true },
  { id: 'person2', icon: '💁‍♂️', isEmoji: true },
  { id: 'person3', icon: '🙅', isEmoji: true },
  { id: 'person4', icon: '🙅‍♂️', isEmoji: true },
  { id: 'person5', icon: '🙆', isEmoji: true },
  { id: 'person6', icon: '🙆‍♂️', isEmoji: true },
  { id: 'person7', icon: '🙋', isEmoji: true },
  { id: 'person8', icon: '🙋‍♂️', isEmoji: true },
  { id: 'person9', icon: '🤦‍♀️', isEmoji: true },
  { id: 'person10', icon: '🤦‍♂️', isEmoji: true },
  { id: 'person11', icon: '🤷‍♀️', isEmoji: true },
  { id: 'person12', icon: '🤷‍♂️', isEmoji: true },
  { id: 'person13', icon: '🙎', isEmoji: true },
  { id: 'person14', icon: '🙎‍♂️', isEmoji: true },
  { id: 'person15', icon: '🙍', isEmoji: true },
  { id: 'person16', icon: '🙍‍♂️', isEmoji: true },
  { id: 'person17', icon: '💇', isEmoji: true },
  { id: 'person18', icon: '💇‍♂️', isEmoji: true },
  { id: 'person19', icon: '💆', isEmoji: true },
  { id: 'person20', icon: '💆‍♂️', isEmoji: true },
  { id: 'person21', icon: '🕴', isEmoji: true },
  { id: 'person22', icon: '💃', isEmoji: true },
  { id: 'person23', icon: '🕺', isEmoji: true },
  { id: 'person24', icon: '👯', isEmoji: true },
  { id: 'person25', icon: '👯‍♂️', isEmoji: true },
  { id: 'person26', icon: '🚶‍♀️', isEmoji: true },
  { id: 'person27', icon: '🚶', isEmoji: true },
  { id: 'person28', icon: '🏃‍♀️', isEmoji: true },
  { id: 'person29', icon: '🏃', isEmoji: true },
  { id: 'persons1', icon: '👫', isEmoji: true },
  { id: 'persons2', icon: '👭', isEmoji: true },
  { id: 'persons3', icon: '👬', isEmoji: true },
  { id: 'persons4', icon: '💑', isEmoji: true },
  { id: 'persons5', icon: '👩‍❤️‍👩', isEmoji: true },
  { id: 'persons6', icon: '👨‍❤️‍👨', isEmoji: true },
  { id: 'persons7', icon: '💏', isEmoji: true },
  { id: 'persons8', icon: '👩‍❤️‍💋‍👩', isEmoji: true },
  { id: 'persons9', icon: '👨‍❤️‍💋‍👨', isEmoji: true },
  { id: 'persons10', icon: '👪', isEmoji: true },
  { id: 'persons11', icon: '👨‍👩‍👧', isEmoji: true },
  { id: 'persons12', icon: '👨‍👩‍👧‍👦', isEmoji: true },
  { id: 'persons13', icon: '👨‍👩‍👦‍👦', isEmoji: true },
  { id: 'persons14', icon: '👨‍👩‍👧‍👧', isEmoji: true },
  { id: 'persons15', icon: '👩‍👩‍👦', isEmoji: true },
  { id: 'persons16', icon: '👩‍👩‍👧', isEmoji: true },
  { id: 'persons17', icon: '👩‍👩‍👧‍👦', isEmoji: true },
  { id: 'persons18', icon: '👩‍👩‍👦‍👦', isEmoji: true },
  { id: 'persons19', icon: '👩‍👩‍👧‍👧', isEmoji: true },
  { id: 'persons20', icon: '👨‍👨‍👦', isEmoji: true },
  { id: 'persons21', icon: '👨‍👨‍👧', isEmoji: true },
  { id: 'persons22', icon: '👨‍👨‍👧‍👦', isEmoji: true },
  { id: 'persons23', icon: '👨‍👨‍👦‍👦', isEmoji: true },
  { id: 'persons24', icon: '👨‍👨‍👧‍👧', isEmoji: true },
  { id: 'persons25', icon: '👩‍👦', isEmoji: true },
  { id: 'persons26', icon: '👩‍👧', isEmoji: true },
  { id: 'persons27', icon: '👩‍👧‍👦', isEmoji: true },
  { id: 'persons28', icon: '👩‍👦‍👦', isEmoji: true },
  { id: 'persons29', icon: '👩‍👧‍👧', isEmoji: true },
  { id: 'persons30', icon: '👨‍👦', isEmoji: true },
  { id: 'persons31', icon: '👨‍👧', isEmoji: true },
  { id: 'persons32', icon: '👨‍👧‍👦', isEmoji: true },
  { id: 'persons33', icon: '👨‍👦‍👦', isEmoji: true },
  { id: 'persons34', icon: '👨‍👧‍👧', isEmoji: true },
  { id: 'transport1', icon: '🚗', isEmoji: true },
  { id: 'transport2', icon: '🚕', isEmoji: true },
  { id: 'transport3', icon: '🚙', isEmoji: true },
  { id: 'transport4', icon: '🚌', isEmoji: true },
  { id: 'transport5', icon: '🚎', isEmoji: true },
  { id: 'transport6', icon: '🏎️', isEmoji: true },
  { id: 'transport7', icon: '🚓', isEmoji: true },
  { id: 'transport8', icon: '🚑', isEmoji: true },
  { id: 'transport9', icon: '🚒', isEmoji: true },
  { id: 'transport10', icon: '🚐', isEmoji: true },
  { id: 'transport11', icon: '🚚', isEmoji: true },
  { id: 'transport12', icon: '🚛', isEmoji: true },
  { id: 'transport13', icon: '🚜', isEmoji: true },
  { id: 'transport14', icon: '🛴', isEmoji: true },
  { id: 'transport15', icon: '🚲', isEmoji: true },
  { id: 'transport16', icon: '🛵', isEmoji: true },
  { id: 'transport17', icon: '🏍️', isEmoji: true },
  { id: 'transport18', icon: '🛺', isEmoji: true },
  { id: 'transport19', icon: '🚨', isEmoji: true },
  { id: 'transport20', icon: '🚔', isEmoji: true },
  { id: 'transport21', icon: '🚍', isEmoji: true },
  { id: 'transport22', icon: '🚘', isEmoji: true },
  { id: 'transport23', icon: '🚖', isEmoji: true },
  { id: 'transport24', icon: '🚡', isEmoji: true },
  { id: 'transport25', icon: '🚠', isEmoji: true },
  { id: 'transport26', icon: '🚟', isEmoji: true },
  { id: 'transport27', icon: '🚃', isEmoji: true },
  { id: 'transport28', icon: '🚋', isEmoji: true },
  { id: 'transport29', icon: '🚞', isEmoji: true },
  { id: 'transport30', icon: '🚝', isEmoji: true },
  { id: 'transport31', icon: '🚄', isEmoji: true },
  { id: 'transport32', icon: '🚅', isEmoji: true },
  { id: 'transport33', icon: '🚈', isEmoji: true },
  { id: 'transport34', icon: '🚂', isEmoji: true },
  { id: 'transport35', icon: '🚆', isEmoji: true },
  { id: 'transport36', icon: '🚇', isEmoji: true },
  { id: 'transport37', icon: '🚊', isEmoji: true },
  { id: 'transport38', icon: '🚉', isEmoji: true },
  { id: 'transport39', icon: '🚁', isEmoji: true },
  { id: 'transport40', icon: '🛩️', isEmoji: true },
  { id: 'transport41', icon: '✈️', isEmoji: true },
  { id: 'transport42', icon: '🛫', isEmoji: true },
  { id: 'transport43', icon: '🛬', isEmoji: true },
  { id: 'transport44', icon: '🪂', isEmoji: true },
  { id: 'transport45', icon: '🚀', isEmoji: true },
  { id: 'transport46', icon: '🛰️', isEmoji: true },
  { id: 'transport47', icon: '🛸', isEmoji: true },
  { id: 'transport48', icon: '💺', isEmoji: true },
  { id: 'transport49', icon: '🛶', isEmoji: true },
  { id: 'transport50', icon: '⛵️', isEmoji: true },
  { id: 'transport51', icon: '🛥️', isEmoji: true },
  { id: 'transport52', icon: '🚤', isEmoji: true },
  { id: 'transport53', icon: '🛳️', isEmoji: true },
  { id: 'transport54', icon: '⛴️', isEmoji: true },
  { id: 'transport55', icon: '🚢', isEmoji: true },
  { id: 'heart1', icon: '❤️', isEmoji: true },
  { id: 'heart2', icon: '💛', isEmoji: true },
  { id: 'heart3', icon: '💚', isEmoji: true },
  { id: 'heart4', icon: '💙', isEmoji: true },
  { id: 'heart5', icon: '💜', isEmoji: true },
  { id: 'heart6', icon: '🖤', isEmoji: true },
  { id: 'heart7', icon: '🤎', isEmoji: true },
  { id: 'heart8', icon: '🤍', isEmoji: true },
  { id: 'heart9', icon: '🧡', isEmoji: true },
  { id: 'heart10', icon: '💔', isEmoji: true },
  { id: 'heart11', icon: '❣️', isEmoji: true },
  { id: 'heart12', icon: '💕', isEmoji: true },
  { id: 'heart13', icon: '💞', isEmoji: true },
  { id: 'heart14', icon: '💓', isEmoji: true },
  { id: 'heart15', icon: '💗', isEmoji: true },
  { id: 'heart16', icon: '💖', isEmoji: true },
  { id: 'heart17', icon: '💘', isEmoji: true },
  { id: 'heart18', icon: '💝', isEmoji: true },
  { id: 'heart19', icon: '💟', isEmoji: true },
  { id: 'object1', icon: '☢️', isEmoji: true },
  { id: 'object2', icon: '☣️', isEmoji: true },
  { id: 'object3', icon: '📴', isEmoji: true },
  { id: 'object4', icon: '📳', isEmoji: true },
  { id: 'object5', icon: '✴️', isEmoji: true },
  { id: 'object6', icon: '🆚', isEmoji: true },
  { id: 'object7', icon: '❌', isEmoji: true },
  { id: 'object8', icon: '⭕️', isEmoji: true },
  { id: 'object9', icon: '🛑', isEmoji: true },
  { id: 'object10', icon: '⛔️', isEmoji: true },
  { id: 'object11', icon: '🚫', isEmoji: true },
  { id: 'object12', icon: '💯', isEmoji: true },
  { id: 'object13', icon: '❗️', isEmoji: true },
  { id: 'object14', icon: '❓', isEmoji: true },
  { id: 'object15', icon: '⁉️', isEmoji: true },
  { id: 'object16', icon: '🔅', isEmoji: true },
  { id: 'object17', icon: '⚠️', isEmoji: true },
  { id: 'object18', icon: '❎', isEmoji: true },
  { id: 'object19', icon: '🚾', isEmoji: true },
  { id: 'object20', icon: '♿️', isEmoji: true },
  { id: 'object21', icon: '🅿️', isEmoji: true },
  { id: 'object22', icon: '🚹', isEmoji: true },
  { id: 'object23', icon: '🚺', isEmoji: true },
  { id: 'object24', icon: '🚻', isEmoji: true },
  { id: 'object25', icon: '🚮', isEmoji: true },
  { id: 'object26', icon: '🆗', isEmoji: true },
  { id: 'object27', icon: '▶️', isEmoji: true },
  { id: 'object28', icon: '⏩', isEmoji: true },
  { id: 'object29', icon: '⏪', isEmoji: true },
  { id: 'object30', icon: '⏫', isEmoji: true },
  { id: 'object31', icon: '⏬', isEmoji: true },
  { id: 'object32', icon: '◀️', isEmoji: true },
  { id: 'object33', icon: '🔼', isEmoji: true },
  { id: 'object34', icon: '🔽', isEmoji: true },
  { id: 'object35', icon: '➡️', isEmoji: true },
  { id: 'object36', icon: '⬅️', isEmoji: true },
  { id: 'object37', icon: '⬆️', isEmoji: true },
  { id: 'object38', icon: '⬇️', isEmoji: true },
  { id: 'object39', icon: '↪️', isEmoji: true },
  { id: 'object40', icon: '↩️', isEmoji: true },
  { id: 'object41', icon: '⤴️', isEmoji: true },
  { id: 'object42', icon: '⤵️', isEmoji: true },
  { id: 'object43', icon: '🔀', isEmoji: true },
  { id: 'object44', icon: '🔁', isEmoji: true },
  { id: 'object45', icon: '🔂', isEmoji: true },
  { id: 'object46', icon: '🔄', isEmoji: true },
  { id: 'object47', icon: '🔃', isEmoji: true },
  { id: 'object48', icon: '☑️', isEmoji: true },
  { id: 'object49', icon: '↕️', isEmoji: true },
  { id: 'object50', icon: '↔️', isEmoji: true },
  { id: 'object51', icon: '➕', isEmoji: true },
  { id: 'object52', icon: '➖', isEmoji: true },
  { id: 'object53', icon: '➗', isEmoji: true },
  { id: 'object54', icon: '✖️', isEmoji: true },
  { id: 'object55', icon: '🔈', isEmoji: true },
  { id: 'object56', icon: '🔇', isEmoji: true },
  { id: 'object57', icon: '🔉', isEmoji: true },
  { id: 'object58', icon: '🔊', isEmoji: true },
  { id: 'object59', icon: '🔔', isEmoji: true },
  { id: 'object60', icon: '🔕', isEmoji: true },
  { id: 'object61', icon: '🕐', isEmoji: true },

];

export function getReactionDef(id: ReactionId): ReactionDef {
  return reactionDefs.find((r) => r.id === id) ?? reactionDefs[0];
}

export const emojiReactions = reactionDefs.filter((r) => r.isEmoji);
export const quickReactions = reactionDefs.filter((r) => !r.isEmoji);