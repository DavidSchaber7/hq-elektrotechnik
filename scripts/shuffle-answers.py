#!/usr/bin/env python3
"""Shuffle answer options so correct answer is randomly distributed across A/B/C/D."""
import json
import random
import os

random.seed(42)  # Reproducible shuffle

data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'data')

for filename in ['technik.json', 'organisation.json', 'fuehrung.json']:
    filepath = os.path.join(data_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for q in data['questions']:
        correct_idx = q['correct']
        correct_text = q['options'][correct_idx]

        # Shuffle options
        options = list(q['options'])
        random.shuffle(options)

        # Find new index of correct answer
        new_correct = options.index(correct_text)

        q['options'] = options
        q['correct'] = new_correct

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Verify distribution
    counts = [0, 0, 0, 0]
    for q in data['questions']:
        counts[q['correct']] += 1
    total = len(data['questions'])
    dist = ', '.join(f"{['A','B','C','D'][i]}: {c} ({round(c/total*100)}%)" for i, c in enumerate(counts))
    print(f"{filename}: {dist}")

print("\nDone! Answers shuffled.")
