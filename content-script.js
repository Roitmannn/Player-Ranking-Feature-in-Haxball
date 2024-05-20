const ranks = ["worst", "bad", "average", "good", "best", "neutral"];

const rankColors = {
    worst: "black",
    bad: "red",
    average: "orange",
    good: "yellow",
    best: "green",
    neutral: "transparent", // You can change this color as per your requirement
  };

const rankSymbols = {
  best: "&#128215",
  neutral: "&#128214",
  bad: "&#128213",
  good: "&#128210",
  average: "&#128217",
  worst: "&#128169",
};

// Sleep function
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Add buttons to player
function addButtonsToPlayer(player) {
  if (player.childNodes.length === 5) {
    return;
  }

  const playerName = player.querySelector('[data-hook="name"]').innerHTML;
  const rankMenuButton = document.createElement("button");
  rankMenuButton.innerHTML = rankSymbols["neutral"];
  rankMenuButton.style.backgroundColor = "transparent";
  rankMenuButton.style.position = "absolute"; // Add this line
  rankMenuButton.style.right = "5px"; // Add this line

  rankMenuButton.addEventListener("click", () => {
    openRanksMenu(player);
  });
  const pingButton = player.querySelector('[data-hook="ping"]');
  pingButton.addEventListener("click", () => {
    openRanksMenu(player);
  });

  const popup = document.createElement("div");
  popup.style.width = "100%";
  popup.style.backgroundColor = "rgba(255, 255, 255, 0.8)"; // Set background to white with 50% opacity


  ranks.forEach((rank) => {
    const rankButton = document.createElement("button");
    rankButton.innerHTML = rankSymbols[rank];
    rankButton.style.width = "5%";
    rankButton.style.marginRight = "0.05%"; // Added a small margin to separate the buttons
    rankButton.style.backgroundColor = "transparent";
    rankButton.addEventListener("click", () => {
      rankSelected(player, rank);
    });
    popup.appendChild(rankButton);
  });

  popup.style.position = "absolute";
  popup.style.zIndex = "1000";
  popup.style.display = "none";
  popup.style.right = "0px";
  popup.style.flexDirection = "row";
  popup.classList.add("popup");
  player.appendChild(popup);

  player.style.position = "relative";
  player.style.overflow = "visible";
  player.style.borderWidth = "4px";
  player.style.borderStyle = "solid";

  chrome.storage.local.get([playerName], function (result) {
    rankSelected(player, result[playerName] || "neutral");
  });
}

function openRanksMenu(player) {
  closeAllPopups();

  const popup = player.querySelector(".popup");
  popup.style.display = "block";
}

function closeAllPopups() {
  gameDocument =
    document.getElementsByClassName("gameframe")[0].contentWindow.document;
  const allPopups = gameDocument.querySelectorAll(".popup");
  allPopups.forEach((popup) => {
    popup.style.display = "none";
  });
}

function rankSelected(player, rank) {
  const popup = player.querySelector(".popup");
  const playerName = player.querySelector('[data-hook="name"]').innerHTML;

  chrome.storage.local.set({ [playerName]: rank });

  popup.style.display = "none";

  player.style.borderColor = rankColors[rank];
}

// Wait until the game in iFrame loads, then continue
function waitForElement(selector) {
  return new Promise(function (resolve, reject) {
    const element = document
      .getElementsByClassName("gameframe")[0]
      .contentWindow.document.querySelector(selector);

    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        const nodes = Array.from(mutation.addedNodes);
        for (const node of nodes) {
          if (node.matches && node.matches(selector)) {
            resolve(node);
            return;
          }
        }
      });
    });

    observer.observe(
      document.getElementsByClassName("gameframe")[0].contentWindow.document,
      { childList: true, subtree: true }
    );
  });
}

// Main observer to detect changes to views
const moduleObserver = new MutationObserver(function (mutations) {
  const candidates = mutations
    .flatMap((x) => Array.from(x.addedNodes))
    .filter((x) => x.className);

  if (candidates.length === 1) {
    const tempView = candidates[0].className;
    switch (tempView) {
      case "player-list-item":
      case "game-view":
      case "room-view":
        sleep(500).then(function () {
          const gameDocument =
            document.getElementsByClassName("gameframe")[0].contentWindow
              .document;
          const players =
            gameDocument.getElementsByClassName("player-list-item");
          for (const player of players) {
            addButtonsToPlayer(player);
          }
        });
        break;
    }
  }
});

// Where it all begins for view detection
const init = waitForElement("div[class$='view']");
init.then(function (value) {
  const currentView = value.parentNode;
  moduleObserver.observe(currentView, { childList: true, subtree: true });
});
