using HtmlAgilityPack;
using Newtonsoft.Json;
using Parser.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
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
                    case "recalculateAll": // nie zadziała odpowiednio po zmianach na stronie FIFA
                        DeleteFiles();
                        CreateRankingFiles();
                        CreateTeamFiles();
                        break;

                    case "updateWithLast":
                        result = UpdateWithLast();
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

        #region Private Methods

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

        private Ranking GetRankingById(int id) // przestarzałe
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
                var dateHtml = html.DocumentNode.SelectNodes("//div[@class='slider slider-mock ranking-browser']/div[@class='slider-wrap']/ul/li");
                if (dateHtml == null && id == 1) // ranking o id = 1 nie ma daty na stronie FIFA
                {
                    latestRanking.Date = new DateTime(1992, 12, 1); // przyjmuje się datę 1 grudnia 1992
                }
                else
                {
                    var dateString = dateHtml.SingleOrDefault<HtmlNode>().InnerText;
                    string[] dateTable = dateString.Split(' ');
                    latestRanking.Date = new DateTime(Int32.Parse(dateTable[2]), DateTime.ParseExact(dateTable[1], "MMMM", CultureInfo.InvariantCulture).Month, Int32.Parse(dateTable[0]));
                }
            }
            catch (Exception ex) 
            {
                 throw new ApplicationException("[GetRankingById] Problem z odczytem rankingu o id=" + id.ToString() + " ze strony FIFA", ex);
               
            }

            // get team data
            foreach (HtmlNode table in html.DocumentNode.SelectNodes("//tbody"))
            {
                foreach (HtmlNode row in table.SelectNodes("tr"))
                {
                    var team = new TeamInRank();

                    team.Rank = Int32.Parse(row.SelectNodes(".//td[@class='tbl-rank']").SingleOrDefault<HtmlNode>().InnerText);

                    var name = (row.SelectNodes(".//td[@class='tbl-teamname']").SingleOrDefault<HtmlNode>().InnerText);
                    byte[] bytes = Encoding.Default.GetBytes(name);
                    team.Name = Encoding.UTF8.GetString(bytes);
                     
                    team.TotalPoints = Double.Parse(row.SelectNodes(".//td[@class='tbl-points']").SingleOrDefault<HtmlNode>().InnerText.Split('(', ')')[1], System.Globalization.CultureInfo.InvariantCulture);
                    team.PreviousPoints = Int32.Parse(row.SelectNodes(".//td[@class='tbl-prevpoints']").SingleOrDefault<HtmlNode>().InnerText);
                    team.MovePosition = Int32.Parse(row.SelectNodes(".//td[@class='tbl-prevrank']").SingleOrDefault<HtmlNode>().InnerText);
                    team.FlagUrl = "http:" + (row.SelectNodes(".//td[@class='tbl-teamname']").SingleOrDefault<HtmlNode>().FirstChild.FirstChild.Attributes[2].Value);
                    latestRanking.PutTeam(team);
                }
            }
            return latestRanking;
        }

        private Ranking GetRankingBySiteId(int siteId, int id) 
        {
            // prepare document
            Ranking latestRanking = new Ranking();
            latestRanking.Id = id;
            WebClient client = new WebClient();
            client.Encoding = Encoding.UTF8;
            var htmlData = client.DownloadData("http://www.fifa.com/fifa-world-ranking/ranking-table/men/rank/id" + siteId + "/");
            var htmlCode = Encoding.UTF8.GetString(htmlData);

            // (1) encode hak
            htmlCode = htmlCode.Replace("&#244;", "ô"); // Côte d'Ivoire
            htmlCode = htmlCode.Replace("&#39;", "'");  // Côte d'Ivoire
            htmlCode = htmlCode.Replace("&#231;", "ç"); // Curaçao

            // (2) St. Vincent / Grenadines hak: Windows nie dopuszcza znaku "/" w nazwach plikow
            htmlCode = htmlCode.Replace("St. Vincent / Grenadines", "St Vincent and the Grenadines");

            // (3) na stronie "São Tomé e Príncipe" zamieniono w pewnym momencie na "Sao Tome e Principe"
            htmlCode = htmlCode.Replace("Sao Tome e Principe", "São Tomé e Príncipe");

            var html = new HtmlDocument();
            html.LoadHtml(htmlCode);

            // get date
            try
            {
                var dateHtml = html.DocumentNode.SelectNodes("//div[@class='fi-selected-item']");
                if (dateHtml == null && id == 1) // ranking o id = 1 nie ma daty na stronie FIFA
                {
                    latestRanking.Date = new DateTime(1992, 12, 1); // przyjmuje się datę 1 grudnia 1992
                }
                else
                {
                    var dateString = dateHtml.SingleOrDefault<HtmlNode>().InnerText;
                    string[] dateTable = dateString.Split(' ');
                    latestRanking.Date = new DateTime(Int32.Parse(dateTable[2]), DateTime.ParseExact(dateTable[1], "MMMM", CultureInfo.InvariantCulture).Month, Int32.Parse(dateTable[0]));
                }
            }
            catch (Exception ex)
            {
                throw new ApplicationException("[GetRankingById] Problem z odczytem rankingu o id=" + id.ToString() + " ze strony FIFA", ex);

            }

            // get team data
            foreach (HtmlNode table in html.DocumentNode.SelectNodes("//tbody"))
            {
                foreach (HtmlNode row in table.SelectNodes("tr"))
                {
                    var team = new TeamInRank();
                    var test = row.SelectNodes(".//td[contains(@class,'fi-table__rank')]");
                    team.Rank = Int32.Parse(row.SelectNodes(".//td[contains(@class,'fi-table__rank')]").FirstOrDefault<HtmlNode>().InnerText);

                    var name = (row.SelectNodes(".//td[contains(@class,'fi-table__teamname')]//span[contains(@class,'fi-t__nText ')]").
                        FirstOrDefault<HtmlNode>().InnerText);
                    byte[] bytes = Encoding.Unicode.GetBytes(name);
                    team.Name = Encoding.Unicode.GetString(bytes);

                    if(team.Name == "C&#244;te d&#39;Ivoire") // hak zwiazany z błedem dekodowania w htmlAgilityPack
                    {
                        team.Name = "Côte d'Ivoire";
                    }

                    team.TotalPoints = Int32.Parse(row.SelectNodes(".//td[contains(@class,'fi-table__points')]//span[contains(@class,'text')]").
                        FirstOrDefault<HtmlNode>().InnerText);
                    team.PreviousPoints = Int32.Parse(row.SelectNodes(".//td[contains(@class,'fi-table__prevpoints')]//span[contains(@class,'text')]").
                        FirstOrDefault<HtmlNode>().InnerText);
                    team.MovePosition = Int32.Parse(row.SelectNodes(".//td[contains(@class,'fi-table__rankingmovement')]//span[contains(@class,'text')]").
                        FirstOrDefault<HtmlNode>().InnerText);
                    team.FlagUrl = (row.SelectNodes(".//td[contains(@class,'fi-table__teamname')]//*//img[contains(@class,'fi-flag--4')]").
                        FirstOrDefault<HtmlNode>().Attributes.FirstOrDefault().Value);
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
                try
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
                        else // plik nie istnieje - zrób nowy i pobierz flagę
                        {
                            List<TeamInFile> initialList = new List<TeamInFile>(); // lista z tylko jednym wpisem
                            initialList.Add(teamInFile);
                            string json = JsonConvert.SerializeObject(initialList, Newtonsoft.Json.Formatting.Indented);

                            System.IO.File.WriteAllText(path + "/data/teams/" + teamInRank.Name + ".json", json);

                            using (var client = new WebClient()){
                                client.DownloadFile(teamInRank.FlagUrl, path + "data/flags/" + teamInRank.Name + ".png");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    if (i>260) // zaimportowałem wszystkie rankingi do plików [kraj].json
                    {
                        CreateTeamList(); // tworzę listę krajów na podstawie plików
                    }
                    throw ex;
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
                    break;
                    throw new ApplicationException("Wykonano 'CreateRankingFiles' aż do id = " + (i-1).ToString() +".Nie ma rankingu o Id = "+i.ToString(), ex);
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

        private string UpdateWithLast() // aktualizacja najnowszym rankingiem
        {
            // wyznacz ostatnie Id
            string path = AppDomain.CurrentDomain.BaseDirectory;
            int lastIdInFiles = -1;
            DateTime lastDateInFiles = new DateTime(1992,12,1);

            using (StreamReader r = new StreamReader(path + "data/rankings/_rankingsList.json"))
            {
                string json = r.ReadToEnd();
                List<RankingInList> items = JsonConvert.DeserializeObject<List<RankingInList>>(json);
                lastIdInFiles = items.LastOrDefault().Id;
                lastDateInFiles = items.LastOrDefault().Date;
            }

            var nextSiteId = GetNextSiteId(lastDateInFiles);

            try
            {
                Ranking lastRanking = GetRankingBySiteId(nextSiteId, lastIdInFiles + 1);

                // ######################### dopisz do _rankingsList
                // #########################
                string output = null;
                using (StreamReader r = new StreamReader(path + "/data/rankings/_rankingsList.json"))
                {
                    string json = r.ReadToEnd();
                    List<RankingInList> items = JsonConvert.DeserializeObject<List<RankingInList>>(json);
                    items.Add(new RankingInList { Id = lastRanking.Id, Date = lastRanking.Date });
                    output = Newtonsoft.Json.JsonConvert.SerializeObject(items, Newtonsoft.Json.Formatting.Indented);
                    r.Close();
                }
                System.IO.File.WriteAllText(path + "/data/rankings/_rankingsList.json", output);

                // ######################### stwórz plik xxx.json gdzie xxx to id najnowszego rankingu
                // #########################
                string json2 = JsonConvert.SerializeObject(lastRanking);
                var rankingForList = new RankingInList() { Id = lastRanking.Id, Date = lastRanking.Date };
                System.IO.File.WriteAllText(path + "data/rankings/" + (lastIdInFiles + 1) + ".json", json2);

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
                        System.IO.File.WriteAllText(path + "/data/teams/" + teamInRank.Name + ".json", outputTeam);
                    }
                    else // plik nie istnieje - zrób nowy (doszła w najnowszym rankingu jakaś nowa drużyna) i weź flagę
                    {
                        List<TeamInFile> initialList = new List<TeamInFile>(); // lista z tylko jednym wpisem
                        initialList.Add(teamInFile);
                        string json = JsonConvert.SerializeObject(initialList, Newtonsoft.Json.Formatting.Indented);

                        System.IO.File.WriteAllText(path + "/data/teams/" + teamInRank.Name.Replace("/","&") + ".json", json);

                        using (var client = new WebClient()) {
                            client.DownloadFile(teamInRank.FlagUrl, path + "data/flags/" + teamInRank.Name.Replace("/", "&") + ".png");
                        }
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
                throw new ApplicationException("Nie powiodło się updateWithLast. Sprawdź czy dane nie są już aktualne. " + ex.Message, ex);
            }
            return "[updateWithLast] zakończono powodzeniem";
        }

        private void DeleteFiles() // czyści foldery "rankings", "teams" i "flags"
        {
            string path = AppDomain.CurrentDomain.BaseDirectory;
            System.IO.DirectoryInfo dirRankings = new DirectoryInfo(path + @"\data\rankings");
            System.IO.DirectoryInfo dirTeams = new DirectoryInfo(path + @"\data\teams");
            System.IO.DirectoryInfo dirFlags = new DirectoryInfo(path + @"\data\flags");

            foreach (FileInfo file in dirRankings.GetFiles())
            {
                file.Delete();
            }

            foreach (FileInfo file in dirTeams.GetFiles())
            {
                file.Delete();
            }

            foreach (FileInfo file in dirFlags.GetFiles()) {
                file.Delete();
            }
        }

        private int GetNextSiteId(DateTime date) // pobiera NASTĘPNE siteId na podstawie daty
        {
            WebClient client = new WebClient();
            string downloadString = client.DownloadString("http://www.fifa.com/fifa-world-ranking/ranking-table/men/");
            var html = new HtmlDocument();
            html.LoadHtml(downloadString);

            // get list
            var siteList = html.DocumentNode.SelectNodes("//ul[@class='fi-ranking-schedule__nav dropdown-menu']").SingleOrDefault<HtmlNode>();
            int nextSiteId = -1;
            int prevSiteId = -1;

            foreach (HtmlNode element in siteList.SelectNodes("li"))
            {
                // date form site list
                var dateString = element.SelectNodes("a").SingleOrDefault<HtmlNode>().InnerText;
                DateTime _date = DateTime.ParseExact(dateString, "d MMMM yyyy",CultureInfo.InvariantCulture);

                if (date == _date)
                {
                    nextSiteId = prevSiteId;
                    break;
                }

                // siteId from site list
                var link = element.SelectNodes("a").SingleOrDefault<HtmlNode>().Attributes.FirstOrDefault().Value;
                var siteString = link.Split('/')[5];
                int siteId = Int32.Parse(siteString.Replace("id", ""));

                prevSiteId = siteId;
            }

            return nextSiteId;
        }

        #endregion Private Methods

    }
}