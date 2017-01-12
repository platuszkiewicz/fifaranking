using System;

namespace Parser.Model
{
    class TeamInRank
    {
        public int Rank { get; set; }
        public string Name { get; set; }
        public double TotalPoints { get; set; }
        public int PreviousPoints { get; set; }
        public int MovePosition { get; set; }
        public string FlagUrl { get; set; }
    }
}
