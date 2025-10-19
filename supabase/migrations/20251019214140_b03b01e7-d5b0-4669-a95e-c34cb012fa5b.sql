-- Delete existing wrong credential with incorrect Services ID
DELETE FROM public.apple_signin_credentials 
WHERE user_id = '1cf40a00-135e-4781-9f9c-f6dd7094aa85';