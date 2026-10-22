export type PlayerStatus = "waiting" | "playing" | "rest";
export type Player = {id:number;name:string;level:number;status:PlayerStatus;point:number;matchCount:number;win:number;lose:number;draw:number;comment?:string};
export type Court = {id:number;status:"playing"|"empty";teamA?:Player[];teamB?:Player[]};
export type Match = {id:number;date:string;courtId:number;teamA:string[];teamB:string[];scoreA:number;scoreB:number};
export type State = {players:Player[];courts:Court[];matchHistory:Match[];pairHistory:{p1:number;p2:number}[];courtCount:number};
export const emptyState:State = {players:[],courts:[],matchHistory:[],pairHistory:[],courtCount:3};
