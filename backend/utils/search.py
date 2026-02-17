"""Shared full-text search utilities."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def apply_search_filter(
    query,
    search: str,
    vector_field: str = "search_vector",
    fallback_field: str = "name",
):
    """Apply full-text search with ilike fallback.

    Tries PostgreSQL FTS first (prefix matching via :*).
    Falls back to case-insensitive LIKE on *fallback_field* if FTS fails
    (e.g. when the search string contains characters that break tsquery syntax).
    """
    try:
        fts_query = ":* & ".join(search.split()) + ":*"
        return query.fts(vector_field, fts_query)
    except Exception:
        logger.debug("FTS failed for query %r, falling back to ilike", search)
        safe = search.replace("%", "").replace("_", "")
        return query.ilike(fallback_field, f"%{safe}%")
