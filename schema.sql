DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS playlist;



CREATE TABLE tracks(
	id integer PRIMARY KEY AUTOINCREMENT,
	artist_name text,
	track_name text,
	track_uri text,
	album_name text,
	album_url text,
	artist_bio text,
	playlist_id integer
);

CREATE TABLE playlist (
	id integer PRIMARY KEY AUTOINCREMENT,
	name VARCHAR
);