import sys
import json
import difflib
from ikapi import IKApi, FileStorage

# Read args from command line
title = sys.argv[1]
token = sys.argv[2]

# Init
class Args:
    def __init__(self):
        self.token = token
        self.datadir = "./"
        self.maxcites = 0
        self.maxcitedby = 0
        self.orig = False
        self.maxpages = 1
        self.pathbysrc = False
        self.numworkers = 1
        self.addedtoday = False
        self.fromdate = None
        self.todate = None
        self.sortby = None
        self.maxresults = 5  # ✅ Add this to fix the error

args = Args()
storage = FileStorage(args.datadir)
ik = IKApi(args, storage)

# Perform search
raw_results = ik.search(title, 0, 5)
results = json.loads(raw_results) 
if results and 'docs' in results and results['docs']:
    top_docs = results['docs'][:5]

    # Find closest match
    titles = [doc['title'] for doc in top_docs]
    best_title = difflib.get_close_matches(title, titles, n=1)
    best_doc = next((doc for doc in top_docs if doc['title'] == best_title[0]), top_docs[0]) if best_title else top_docs[0]

    output = {
        "input": title,
        "best_match": {
            "title": best_doc['title'],
            "url": f"https://indiankanoon.org/doc/{best_doc['tid']}/"
        },
        "top_results": [
            {
                "title": doc['title'],
                "url": f"https://indiankanoon.org/doc/{doc['tid']}/"
            } for doc in top_docs
        ]
    }

    print(json.dumps(output))
else:
    print(json.dumps({"error": "No results found", "input": title}))
