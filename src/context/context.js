import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";
import { useContext } from "react";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);

    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );

    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      const userRepos = axios(`${rootUrl}/users/${login}/repos?per_page=100`);
      const userFollowers = axios(followers_url);

      await Promise.allSettled([userFollowers, userRepos])
        .then((results) => {
          const [followers, repos] = results;

          const status = "fulfilled";
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));

      //https://api.github.com/users/john-smilga/repos?per_page=100
      //https://api.github.com/users/john-smilga/followers
    } else {
      toggleError(true, "there is no user with that username");
    }
    setIsLoading(false);
  };

  //check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(
        ({
          data: {
            rate: { remaining },
          },
        }) => {
          setRequests(remaining);
          if (remaining === 0) {
            toggleError(
              true,
              "sorry you have exceeded your hourly rate limit!!"
            );
          }
        }
      )
      .catch((err) => console.log(err));
  };

  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  useEffect(checkRequests, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

const useGlobalContext = () => {
  return useContext(GithubContext);
};

export { GithubProvider, GithubContext, useGlobalContext };
