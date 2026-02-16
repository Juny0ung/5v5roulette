import { describe, expect, it } from "vitest";
import { TeamDicider } from '../teamDicider';

function testLaneResult(teamDicider: TeamDicider): any {
    const winners = [
        { name: 'jg', hue: 0 }, 
        { name: 'adc', hue: 0 }, 
        { name: 'sup', hue: 0 }
    ] as any;
    teamDicider.updateTeams(winners, false);
    const laneResult1 = (teamDicider as any)._laneResult;
    expect(laneResult1).toEqual([1, 3, 4]);

    winners.push(...[
        { name: 'mid', hue: 0 }, 
        { name: 'top', hue: 0 }
    ]);
    teamDicider.updateTeams(winners, false);
    const laneResult2 = (teamDicider as any)._laneResult;
    expect(laneResult2).toEqual([1, 3, 4, 2, 0]);

    return winners;
}

function testResult(teamDicider: TeamDicider, winners: any,
    result1: string[], remainderCnt1: number, 
    result2: string[], remainderCnt2: number,
    result3: string[], remainderCnt3: number) {

    teamDicider.updateTeams([], false);

    winners.push(...[
        { name: 'a', hue: 0 }, 
        { name: 'f', hue: 0 }, 
        { name: 'g', hue: 0 }, 
        { name: 'b', hue: 0 }, 
        { name: 'c', hue: 0 }, 
        { name: 'h', hue: 0 }, 
        { name: 'd', hue: 0 } 
    ]);
    teamDicider.updateTeams(winners, false);
    const teamResult1 = (teamDicider as any)._teamResult;
    const remainders1 = (teamDicider as any)._remainders;
    expect(teamResult1).toEqual(result1);
    expect(remainders1.length).toBe(remainderCnt1);

    winners.push(...[{ name: 'i', hue: 0 }, { name: 'j', hue: 0 }]);
    teamDicider.updateTeams(winners, false);
    const teamResult2 = (teamDicider as any)._teamResult;
    const remainders2 = (teamDicider as any)._remainders;
    expect(teamResult2).toEqual(result2);
    expect(remainders2.length).toBe(remainderCnt2);

    winners.push({ name: 'e', hue: 0 });
    teamDicider.updateTeams(winners, true);
    const teamResult3 = (teamDicider as any)._teamResult;
    const remainders3 = (teamDicider as any)._remainders;
    expect(teamResult3).toEqual(result3);
    expect(remainders3.length).toBe(remainderCnt3);
}

describe('Balanced', () => {
    const teamDicider = new TeamDicider();

    teamDicider.addGroup();
    teamDicider.addGroup();

    teamDicider.setGroupMembers(0, 'a,b,c,d,e,f');
    teamDicider.setGroupMembers(1, 'g,h,i,j');

    it('FromTop', () => {
        teamDicider.setLaneType('fromTop');
        testResult(teamDicider, [],
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', '', '', ''], 0,
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', '', 'j'], 0,
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', 'e', 'j'], 0
        );
    });

    it('FixedLane_AllFixed', () => {
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, 0, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'g', 'f', 'h', 'b', 'c', '', 'd', '', ''], 0,
            ['a', 'g', 'f', 'h', 'b', 'c', 'i', 'd', 'j', ''], 0,
            ['a', 'g', 'f', 'h', 'b', 'c', 'i', 'd', 'j', 'e'], 0
        );
    });

    it('FixedLane_PartFixed', () => {
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, -1, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'g', '', 'h', 'f', 'b', '', '', '', 'c'], 1,
            ['a', 'g', '', 'h', 'f', 'b', 'i', '', 'j', 'c'], 1,
            ['a', 'g', 'd', 'h', 'f', 'b', 'i', 'e', 'j', 'c'], 0
        );
    });

    it('Random', () => {
        teamDicider.setLaneType('random');
        const winners: any = testLaneResult(teamDicider);
        testResult(teamDicider, winners,
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', '', '', ''], 0,
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', '', 'j'], 0,
            ['a', 'f', 'g', 'b', 'h', 'c', 'd', 'i', 'e', 'j'], 0
        );
    });
});

describe('Unbalanced', () => {
    const teamDicider = new TeamDicider();

    teamDicider.addGroup();
    teamDicider.addGroup();

    teamDicider.setGroupMembers(0, 'a,b,c,d,e');
    teamDicider.setGroupMembers(1, 'f,g,h,i,j');

    it('FromTop', () => {
        teamDicider.setLaneType('fromTop');
        testResult(teamDicider, [],
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', '', '', ''], 0,
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', '', ''], 1,
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', 'e', 'j'], 0
        );
    });

    it('FixedLane_AllFixed', () => {
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, 0, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'f', 'b', 'g', 'c', 'd', 'h', '', '', ''], 0,
            ['a', 'f', 'b', 'g', 'c', 'd', 'h', '', 'i', ''], 1,
            ['a', 'f', 'b', 'g', 'c', 'd', 'h', 'e', 'i', 'j'], 0
        );
    });

    it('FixedLane_PartFixed', () => {
        teamDicider.setLaneType('fixed');
        teamDicider.setFixedLanes([0, 1, -1, 1, 0]);
        testResult(teamDicider, [],
            ['a', 'f', '', 'g', 'b', 'c', 'h', '', '', 'd'], 0,
            ['a', 'f', '', 'g', 'b', 'c', 'h', '', 'i', 'd'], 1,
            ['a', 'f', 'j', 'g', 'b', 'c', 'h', 'e', 'i', 'd'], 0
        );
    });

    it('Random', () => {
        teamDicider.setLaneType('random');
        const winners: any = testLaneResult(teamDicider);
        testResult(teamDicider, winners,
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', '', '', ''], 0,
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', '', ''], 1,
            ['a', 'f', 'g', 'b', 'c', 'd', 'h', 'i', 'e', 'j'], 0
        );
    });
});
