using System;
using System.Collections.Generic;

namespace Parser.Model
{
    class Ranking
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public List<TeamInRank> Teams = new List<TeamInRank>();

        public void PutTeam(TeamInRank team)
        {
            Teams.Add(team);
        }
    }
}
