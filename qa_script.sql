CREATE TABLE public.qa (
	id serial4 NOT NULL,
	qa_ymd varchar(8) NOT NULL,
	qa_inc varchar(2) NOT NULL,
	uploaded bool DEFAULT false NULL,
	uploaded_count int4 DEFAULT 0 NOT NULL,
	downloaded bool DEFAULT false NULL,
	downloaded_count int4 DEFAULT 0 NOT NULL,
	data_flow jsonb,
	created_by varchar(100) DEFAULT ''::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT qa_pkey PRIMARY KEY (id)
);