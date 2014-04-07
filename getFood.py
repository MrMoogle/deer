##
# Food dictionary builder. Built from hyponyms of 'food' synset in WordNet. Prints results
# to stdout.
##

import nltk, re

nltk.data.path.append('./nltk_data/')

from nltk.corpus import wordnet as wn

food = wn.synset('food.n.01')

food = list(set([w for s in food.closure(lambda s:s.hyponyms()) for w in s.lemma_names]))

for f in food:
	if len(f) > 1:  # ignore foods like 'A' and 'B'
		print re.sub('_',' ', f)

