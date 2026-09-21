ALTER TABLE public.series
DROP CONSTRAINT IF EXISTS series_platform_check;

ALTER TABLE public.series
ADD CONSTRAINT series_platform_check
CHECK (platform IN ('Netflix', 'Max', 'Disney+', 'Prime', 'Apple TV', 'SkyShowtime', 'Star', 'Outra'));
