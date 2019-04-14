
class CallingOrderConstructor {

    GetCallingOrder(){
        let callingOrder = [
            {
                'name': 'round end', //morning phase
                'special': true,
                'receivePressedVotePlayers': {}
            },
            {
                'name': 'round end kill decisions',
                'special': true,
                'killDecisionsObject': {}
            },
            {
                'name': 'round end target', //morning phase
                'special': true,
                'targets': [],
                'chosenTarget': ''
            },
            {
                'name': 'end round action', //To gather info about players who clicked on end round button to be able to proceed next round (morning phase)
                'special': true,
                'player': {}
            },
            {
                'name': 'current called role',
                'role': "",
                'special': true
            },
            {
                'name': 'Seer/ Fortune Teller',
                'when': 1,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The fox',
                'when': 2,
                'player': [],
                '1stNight': false,
                'canUseAbility': true
            },
            {
                'name': 'Cupid',
                'when': 3,
                'player': [],
                'canUseAbility': true,
                '1stNight': true
            },
            {
                'name': 'The Lovers',
                'special': true,
                'newSide': false,
                'player': [],
                '1stNight': true
            },
            {
                'name': 'Werewolves',
                'when': 5,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'Werewolves end vote',
                'special': true,
                'receiveEndVoteObject': {}
            },
            {
                'name': 'Werewolves vote target',
                'special': true,
                'werewolvesTargetObject': {}
            },
            {
                'name': 'Werewolves agree on kill',
                'special': true,
                'agreeOnKillObject': {}
            },
            {
                'name': 'Werewolves end turn',
                'special': true,
                'receiveEndTurnObject': {}
            },
            {
                'name': 'Werewolves current target',
                'special': true,
                'player': [],
                'chosen': '',
                '1stNight': false
            },
            {
                'name': 'Werewolves false role',
                'special': true,
                'playerAndFalseRole': {}
            },
            {
                'name': 'The wild child',
                'when': 5,
                'player': [],
                '1stNight': true
            },
            {
                'name': 'The dog wolf',
                'when': 5,
                'player': [],
                '1stNight': true
            },
            {
                'name': 'Little Girl',
                'when': 5,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The savior',
                'when': 6,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'Savior protect target',
                'special': true,
                'player': ''
            },
            {
                'name': 'Witch',
                'when': 7,
                'player': [],
                '1stNight': false,
                'useHeal': false,
                'useKill': false
            },
            {
                'name' : 'Witch kill target',
                'special': true,
                'player': ''
            },
            {
                'name' : 'Witch protect target',
                'special': true,
                'player': ''
            },
            {
                'name': 'Hunter',
                'when': 8,
                'player': [],
                '1stNight': true
            },
            {
                'name': 'Thief',
                'when': 9,
                'player': [],
                '1stNight': true
            },
            {
                'name': 'The village Idiot',
                'when': 10,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The scapegoat',
                'when': 11,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The ancient',
                'when': 12,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The knight with the rusty sword',
                'when': 13,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The bear leader',
                'when': 14,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The knight with the rusty sword',
                'when': 13,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The pied piper',
                'when': 14,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The hypnotized',
                'special': true,
                'player': [],
                '1stNight': false
            },
            {
                'name': 'The two sisters',
                'when': 16,
                'player': [],
                '1stNight': true
            },
            {
                'name': 'The three brothers',
                'when': 17,
                'player': [],
                '1stNight': true
            },
            {
                'name': 'Ordinary Townsfolk',
                'when': 18,
                'player': [],
                '1stNight': true
            }
            ]

        return callingOrder
    }
}

module.exports = CallingOrderConstructor