using System;

namespace Parser.Model
{
    class TeamInFile
    {
        public int Rank { get; set; }
        public double TotalPoints { get; set; }
        public int PreviousPoints { get; set; }
        public int MovePosition { get; set; }

        public DateTime Date { get; set; }
        public int RankId { get; set; }
    }
}
