﻿using HtmlAgilityPack;
using Newtonsoft.Json;
using Parser.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;

namespace Parser
{
    public class Handler : IHttpHandler
    {
        #region IHttpHandler Members

        public bool IsReusable
        {
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            var request = context.Request;
            var response = context.Response;
            var action = request.Params["action"];

            try
            {
                object result = null;
                switch (action)
                {
                    case "recalculateAll":
                        CreateRankingFiles();
                        CreateTeamFiles();
                        CreateTeamList(); // musi być ostatnie!
                        break;

                    case "updateWithLast":
                        // (0) znajdź jakie powinno być najnowsze id wg plików i porównaj ze stroną
                        // RANKINGS:
                        // (1) dopisz jeden element do _rankingsList.json
                        // (2) stwórz plik xxx.json gdzie xxx to id najnowszego rankingu
                        // TEAMS:
                        // (3) dopisz do każdej drużyny najnowszy ranking. Sprowadza się to do CreateTeamFiles() tyle że bez pętli
                        // (4) usuń i zrób od nowa _teamsList.json (mogła dojść nowa drużyna)
                        UpdateWithLast();
                        break;
                }

                var jsonResult = new JsonResult()
                {
                    Success = true,
                    Status = "SUCCESS",
                    Value = result,
                };

                var JsonResultString = JsonConvert.SerializeObject(jsonResult);
                response.Write(JsonResultString);
            }
            catch (WarningException ex)
            {
                var jsonResult = new JsonResult()
                {
                    Success = false,
                    Status = "WARNING",
                    Message = ex.Message
                };
                var jsonResultStr = JsonConvert.SerializeObject(jsonResult);
                response.Write(jsonResultStr);
            }
            catch (Exception ex)
            {
                var jsonResult = new JsonResult()
                {
                    Success = false,
                    Status = "ERROR",
                    Value = ex.Message
                };
                var JsonResultString = JsonConvert.SerializeObject(jsonResult);
                response.Write(JsonResultString);
            }
        }

        #endregion IHttpHandler Members

        private Ranking GetLatestRanking() // nieużywane
        {
            // prepare document
            Ranking latestRanking = new Ranking();
            WebClient client = new WebClient();
            string downloadString = client.DownloadString("http://www.fifa.com/fifa-world-ranking/ranking-table/men/index.html");
            var html = new HtmlDocument();
            html.LoadHtml(downloadString);

            // get date
            var dateString = html.DocumentNode.SelectNodes("//div[@class='slider slider-mock ranking-browser']/div[@class='slider-wrap']/ul/li").SingleOrDefault<HtmlNode>().InnerText;
            string[] dateTable = dateString.Split(' ');
            latestRanking.Date = new DateTime(Int32.Parse(dateTable[2]), DateTime.ParseExact(dateTable[1], "MMMM", CultureInfo.InvariantCulture).Month, Int32.Parse(dateTable[0]));

            // get team data
            foreach (HtmlNode table in html.DocumentNode.SelectNodes("//tbody"))
            {
                foreach (HtmlNode row in table.SelectNodes("tr"))
                {
                    var team = new TeamInRank();

                    team.Rank = Int32.Parse(row.SelectNodes(".//td[@class='tbl-rank']").SingleOrDefault<HtmlNode>().InnerText);
                    team.Name = (row.SelectNodes(".//td[@class='tbl-teamname']").SingleOrDefault<HtmlNode>().InnerText);
                    team.TotalPoints = Double.Parse(row.SelectNodes(".//td[@class='tbl-points']").SingleOrDefault<HtmlNode>().InnerText.Split('(', ')')[1], System.Globalization.CultureInfo.InvariantCulture);
                    team.PreviousPoints = Int32.Parse(row.SelectNodes(".//td[@class='tbl-prevpoints']").SingleOrDefault<HtmlNode>().InnerText);
                    team.MovePosition = Int32.Parse(row.SelectNodes(".//td[@class='tbl-prevrank']").SingleOrDefault<HtmlNode>().InnerText);
                    latestRanking.PutTeam(team);
                }
            }
            return latestRanking;
        }

        private Ranking GetRankingById(int id)
        {
            // prepare document
            Ranking latestRanking = new Ranking();
            latestRanking.Id = id;
            WebClient client = new WebClient();
            string downloadString = client.DownloadString("http://www.fifa.com/fifa-world-ranking/ranking-table/men/rank=" + id + "/index.html");
            var html = new HtmlDocument();
            html.LoadHtml(downloadString);

            // get date
            try
            {
                var dateString = html.DocumentNode.SelectNodes("//div[@class='slider slider-mock ranking-browser']/div[@class='slider-wrap']/ul/li").SingleOrDefault<HtmlNode>().InnerText;
                string[] dateTable = dateString.Split(' ');
                latestRanking.Date = new DateTime(Int32.Parse(dateTable[2]), DateTime.ParseExact(dateTable[1], "MMMM", CultureInfo.InvariantCulture).Month, Int32.Parse(dateTable[0]));
            }
            catch // hak na pierwszy ranking o id=1 (lub inne błędy)
            {
                latestRanking.Date = new DateTime(1992, 12, 1);
                //throw;
            }

            // get team data
            foreach (HtmlNode table in html.DocumentNode.SelectNodes("//tbody"))
            {
                foreach (HtmlNode row in table.SelectNodes("tr"))
                {
                    var team = new TeamInRank();

                    team.Rank = Int32.Parse(row.SelectNodes(".//td[@class='tbl-rank']").SingleOrDefault<HtmlNode>().InnerText);
                    team.Name = (row.SelectNodes(".//td[@class='tbl-teamname']").SingleOrDefault<HtmlNode>().InnerText);
                    team.TotalPoints = Double.Parse(row.SelectNodes(".//td[@class='tbl-points']").SingleOrDefault<HtmlNode>().InnerText.Split('(', ')')[1], System.Globalization.CultureInfo.InvariantCulture);
                    team.PreviousPoints = Int32.Parse(row.SelectNodes(".//td[@class='tbl-prevpoints']").SingleOrDefault<HtmlNode>().InnerText);
                    team.MovePosition = Int32.Parse(row.SelectNodes(".//td[@class='tbl-prevrank']").SingleOrDefault<HtmlNode>().InnerText);
                    latestRanking.PutTeam(team);
                }
            }
            return latestRanking;
        }

        private void CreateTeamFiles() // tworzy pliki [kraj].json od początku do ostatniego rankingu [na podstawie FIFA-WWW]
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;

            for (var i = 1; i < 500; i++)
            {
                var ranking = GetRankingById(i);
                foreach (var teamInRank in ranking.Teams)
                {
                    TeamInFile teamInFile = new Model.TeamInFile()
                    {
                        Rank = teamInRank.Rank,
                        TotalPoints = teamInRank.TotalPoints,
                        PreviousPoints = teamInRank.PreviousPoints,
                        MovePosition = teamInRank.MovePosition,
                        Date = ranking.Date,
                        RankId = ranking.Id
                    };

                    if (System.IO.File.Exists(path + "/data/teams/" + teamInRank.Name + ".json"))
                    { // plik istnieje - dopisz
                        string output = "";
                        using (StreamReader r = new StreamReader(path + "/data/teams/" + teamInRank.Name + ".json"))
                        {
                            string json = r.ReadToEnd();
                            List<TeamInFile> items = JsonConvert.DeserializeObject<List<TeamInFile>>(json);
                            items.Add(teamInFile);
                            output = Newtonsoft.Json.JsonConvert.SerializeObject(items, Newtonsoft.Json.Formatting.Indented);
                        }
                        System.IO.File.WriteAllText(path + "/data/teams/" + teamInRank.Name + ".json", output);
                    }
                    else // plik nie istnieje - zrób nowy
                    {
                        List<TeamInFile> initialList = new List<TeamInFile>(); // lista z tylko jednym wpisem
                        initialList.Add(teamInFile);
                        string json = JsonConvert.SerializeObject(initialList, Newtonsoft.Json.Formatting.Indented);

                        System.IO.File.WriteAllText(path + "/data/teams/" + teamInRank.Name + ".json", json);
                    }
                }
            }
        }

        private void CreateRankingFiles() // tworzy pliki [rankingId].json oraz _rankingsList.json od początku do najnowszego [na podstawie FIFA-WWW]
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
            List<RankingInList> rankingList = new List<RankingInList>();

            for (var i = 1; i < 500; i++)
            {
                try
                {
                    var ranking = GetRankingById(i);
                    string json = JsonConvert.SerializeObject(ranking);

                    var rankingForList = new RankingInList() { Id = ranking.Id, Date = ranking.Date };
                    rankingList.Add(rankingForList);

                    System.IO.File.WriteAllText(path + "data/rankings/" + i + ".json", json);
                }
                catch (Exception ex) // nie ma rankingu o danym id
                {
                    string json = JsonConvert.SerializeObject(rankingList, Newtonsoft.Json.Formatting.Indented);
                    System.IO.File.WriteAllText(path + "data/rankings/_rankingsList.json", json);
                    Exception ex2 = (Exception)Activator.CreateInstance(ex.GetType(), "Wykonano 'CreateRankingFiles' aż do id=" + (i-1).ToString() +". Nie ma rankingu o Id="+i.ToString(), ex);
                    break; // przerywam pętlę
                    throw;
                }
            }
        }

        private void CreateTeamList() // tworzy plik _teamsList.json [na podstawie plików [kraj].json]
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
            List<TeamInList> teamList = new List<TeamInList>();
            string[] teamArray = Directory.GetFiles(path + "/data/teams/", "*.json").Select(Path.GetFileName).ToArray();
            int id = 0;
            // convert array.json to list
            foreach (var team in teamArray)
            {
                if (team != "_teamsList")
                {
                    TeamInList teamInList = new TeamInList();
                    teamInList.Name = team.Substring(0, team.Length - 5);
                    teamInList.id = id;
                    teamList.Add(teamInList);
                    id++; 
                }
            }
            string json = JsonConvert.SerializeObject(teamList);
            System.IO.File.WriteAllText(path + "data/teams/_teamsList.json", json);
        }

        private void UpdateWithLast() // aktualizacja najnowszym rankingiem
        {
            // wyznacz ostatnie Id
            string path = AppDomain.CurrentDomain.BaseDirectory;
            int lastIdInFiles = -1;
            using (StreamReader r = new StreamReader(path + "data/rankings/_rankingsList.json"))
            {
                string json = r.ReadToEnd();
                List<RankingInList> items = JsonConvert.DeserializeObject<List<RankingInList>>(json);
                lastIdInFiles = items.LastOrDefault().Id;
            }

            try
            {
                Ranking lastRanking = GetRankingById(lastIdInFiles+1);

                // ######################### dopisz do _rankingsList
                // #########################
                string output = null;
                using (StreamReader r = new StreamReader(path + "/data/rankings/_rankingsList.json"))
                {
                    string json = r.ReadToEnd();
                    List<RankingInList> items = JsonConvert.DeserializeObject<List<RankingInList>>(json);
                    items.Add(new RankingInList { Id = lastRanking.Id, Date = lastRanking.Date });
                    output = Newtonsoft.Json.JsonConvert.SerializeObject(items, Newtonsoft.Json.Formatting.Indented);
                }
                System.IO.File.WriteAllText(path + "/data/rankings/_rankingsList.json", output);

                // ######################### stwórz plik xxx.json gdzie xxx to id najnowszego rankingu
                // #########################
                string json2 = JsonConvert.SerializeObject(lastRanking);
                var rankingForList = new RankingInList() { Id = lastRanking.Id, Date = lastRanking.Date };
                System.IO.File.WriteAllText(path + "data/rankings/" + lastIdInFiles + ".json", json2);

                // ######################### dopisz do każdej drużyny najnowszy ranking. Sprowadza się to do CreateTeamFiles() tyle że bez pętli
                // #########################
                foreach (var teamInRank in lastRanking.Teams)
                {
                    TeamInFile teamInFile = new Model.TeamInFile()
                    {
                        Rank = teamInRank.Rank,
                        TotalPoints = teamInRank.TotalPoints,
                        PreviousPoints = teamInRank.PreviousPoints,
                        MovePosition = teamInRank.MovePosition,
                        Date = lastRanking.Date,
                        RankId = lastRanking.Id
                    };

                    if (System.IO.File.Exists(path + "/data/teams/" + teamInRank.Name + ".json"))
                    { // plik istnieje - dopisz
                        string outputTeam = "";
                        using (StreamReader r = new StreamReader(path + "/data/teams/" + teamInRank.Name + ".json"))
                        {
                            string json = r.ReadToEnd();
                            List<TeamInFile> items = JsonConvert.DeserializeObject<List<TeamInFile>>(json);
                            items.Add(teamInFile);
                            outputTeam = Newtonsoft.Json.JsonConvert.SerializeObject(items, Newtonsoft.Json.Formatting.Indented);
                        }
                        System.IO.File.WriteAllText(path + "/data/teams/" + teamInRank.Name + ".json", output);
                    }
                    else // plik nie istnieje - zrób nowy (doszła w najnowszym rankingu jakaś nowa drużyna)
                    {
                        List<TeamInFile> initialList = new List<TeamInFile>(); // lista z tylko jednym wpisem
                        initialList.Add(teamInFile);
                        string json = JsonConvert.SerializeObject(initialList, Newtonsoft.Json.Formatting.Indented);

                        System.IO.File.WriteAllText(path + "/data/teams/" + teamInRank.Name + ".json", json);
                    }
                }

                // ######################### usuń i zrób od nowa _teamsList.json (mogła dojść nowa drużyna)
                // #########################
                if (File.Exists(path + "data/teams/_teamsList.json"))
                {
                    File.Delete(path + "data/teams/_teamsList.json");
                    CreateTeamList();
                }
            }
            catch (Exception ex) // nie ma rankingu o takim Id
            {
                Exception ex2 = (Exception)Activator.CreateInstance(ex.GetType(), "Nie powiodło się updateWithLast. Sprawdź czy dane nie są już aktualne.", ex);
                throw ex2;
            }
        }
    }
}

// TODO
//  - nazwy niektorych druzyn sa źle wyswietlane (SĂŁo TomĂ© e PrĂ­ncipe)
//  - Get Latest Ranking nalezy dodac Id