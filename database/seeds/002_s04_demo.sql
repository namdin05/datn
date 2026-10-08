BEGIN;
-- Bộ demo riêng: không sửa quiz, session hoặc kết quả Duy đã seed.
INSERT INTO public.users(id,display_name,role)
VALUES('00000000-0000-0000-0000-000000000001','Demo Teacher','TEACHER')
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.quizzes(id,creator_id,title,description,status,published_at)
VALUES('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001',
 'QForge S04 Demo - 5 questions','Single-choice, 4 options, 100 points per correct answer','PUBLISHED',now())
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.questions(id,quiz_id,content,points,time_limit_seconds,position)
SELECT ('20000000-0000-0000-0000-' || lpad((100+n)::text,12,'0'))::uuid,
 '10000000-0000-0000-0000-000000000004'::uuid,
 content,100,30,n
FROM (VALUES (1,'What is 2 + 2?'),(2,'Which protocol supports bidirectional realtime web communication?'),
 (3,'Which SQL keyword reads data?'),(4,'Which HTTP method commonly creates a resource?'),
 (5,'Which value uniquely identifies a row?')) AS q(n,content)
ON CONFLICT(id) DO NOTHING;

INSERT INTO public.question_options(id,question_id,content,is_correct,position)
SELECT ('30000000-0000-0000-0000-' || lpad((100+n*4+pos)::text,12,'0'))::uuid,
 ('20000000-0000-0000-0000-' || lpad((100+n)::text,12,'0'))::uuid,
 content,pos=1,pos
FROM (VALUES
 (1,1,'4'),(1,2,'3'),(1,3,'5'),(1,4,'6'),
 (2,1,'WebSocket'),(2,2,'FTP'),(2,3,'SMTP'),(2,4,'DNS'),
 (3,1,'SELECT'),(3,2,'DELETE'),(3,3,'DROP'),(3,4,'UPDATE'),
 (4,1,'POST'),(4,2,'GET'),(4,3,'HEAD'),(4,4,'OPTIONS'),
 (5,1,'Primary key'),(5,2,'Display name'),(5,3,'Description'),(5,4,'Timestamp')
) AS o(n,pos,content)
ON CONFLICT(id) DO NOTHING;
COMMIT;
