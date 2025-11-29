
-- =====================================================
-- Phase 1: Create Helper Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_agent_user_id(_agent_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.travel_agents WHERE user_id = _agent_id
$$;

-- =====================================================
-- Phase 2: P0 Critical Payment/Booking Tables
-- =====================================================

-- 1. payment_milestones - has job_id (links to marketplace_jobs)
CREATE POLICY "Job participants can view milestones"
  ON public.payment_milestones FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.marketplace_jobs 
      WHERE user_id = auth.uid() 
         OR assigned_agent_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage milestones"
  ON public.payment_milestones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. payment_intents - has booking_id (links to bookings)
CREATE POLICY "Booking participants can view payment intents"
  ON public.payment_intents FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE traveler_id = auth.uid() 
         OR agent_id = auth.uid()
         OR creator_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment intents"
  ON public.payment_intents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. disputes - has booking_id, raised_by
CREATE POLICY "Participants can view disputes"
  ON public.disputes FOR SELECT
  USING (
    raised_by = auth.uid()
    OR booking_id IN (
      SELECT id FROM public.bookings 
      WHERE traveler_id = auth.uid() 
         OR agent_id = auth.uid()
         OR creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (auth.uid() = raised_by);

CREATE POLICY "Admins can manage all disputes"
  ON public.disputes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Phase 3: P1 Agent Business Tables
-- =====================================================

-- 4. agent_bids
CREATE POLICY "Agents can manage own bids"
  ON public.agent_bids FOR ALL
  USING (agent_id = auth.uid());

CREATE POLICY "Job owners can view bids on their jobs"
  ON public.agent_bids FOR SELECT
  USING (
    job_id IN (SELECT id FROM public.marketplace_jobs WHERE user_id = auth.uid())
  );

-- 5. agent_terms_acceptance
CREATE POLICY "Agents can view own terms acceptance"
  ON public.agent_terms_acceptance FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert terms acceptance"
  ON public.agent_terms_acceptance FOR INSERT
  WITH CHECK (agent_id = auth.uid());

-- 6. auto_assignment_rules
CREATE POLICY "Agents can manage own assignment rules"
  ON public.auto_assignment_rules FOR ALL
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can manage all assignment rules"
  ON public.auto_assignment_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. calendar_events
CREATE POLICY "Agents can manage own calendar events"
  ON public.calendar_events FOR ALL
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all calendar events"
  ON public.calendar_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. quick_reply_templates
CREATE POLICY "Agents can manage own templates"
  ON public.quick_reply_templates FOR ALL
  USING (agent_id = auth.uid());

-- 9. agent_response_tracking
CREATE POLICY "Agents can view own response tracking"
  ON public.agent_response_tracking FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all response tracking"
  ON public.agent_response_tracking FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert response tracking"
  ON public.agent_response_tracking FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Phase 4: P1 Messaging Tables
-- =====================================================

-- 10. booking_messages
CREATE POLICY "Booking participants can view messages"
  ON public.booking_messages FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE traveler_id = auth.uid() 
         OR agent_id = auth.uid()
         OR creator_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send booking messages"
  ON public.booking_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND booking_id IN (
      SELECT id FROM public.bookings 
      WHERE traveler_id = auth.uid() 
         OR agent_id = auth.uid()
         OR creator_id = auth.uid()
    )
  );

-- 11. trip_request_messages
CREATE POLICY "Participants can view trip request messages"
  ON public.trip_request_messages FOR SELECT
  USING (
    sender_id = auth.uid()
    OR trip_request_id IN (SELECT id FROM public.trip_requests WHERE user_id = auth.uid())
    OR proposal_id IN (SELECT id FROM public.trip_proposals WHERE proposer_id = auth.uid())
  );

CREATE POLICY "Users can send trip request messages"
  ON public.trip_request_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 12. user_conversations
CREATE POLICY "Participants can view their conversations"
  ON public.user_conversations FOR SELECT
  USING (
    customer_id = auth.uid()
    OR agent_id = auth.uid()
  );

CREATE POLICY "Participants can create conversations"
  ON public.user_conversations FOR INSERT
  WITH CHECK (
    customer_id = auth.uid()
    OR agent_id = auth.uid()
  );

CREATE POLICY "Participants can update their conversations"
  ON public.user_conversations FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR agent_id = auth.uid()
  );

-- =====================================================
-- Phase 5: P2 Job Attachment Tables
-- =====================================================

-- 13. marketplace_invoices
CREATE POLICY "Job participants can view invoices"
  ON public.marketplace_invoices FOR SELECT
  USING (
    customer_id = auth.uid()
    OR agent_id = auth.uid()
    OR job_id IN (
      SELECT id FROM public.marketplace_jobs 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create invoices"
  ON public.marketplace_invoices FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admins can manage invoices"
  ON public.marketplace_invoices FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 14. marketplace_job_attachments
CREATE POLICY "Job participants can view attachments"
  ON public.marketplace_job_attachments FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR job_id IN (
      SELECT id FROM public.marketplace_jobs 
      WHERE user_id = auth.uid()
         OR assigned_agent_id = auth.uid()
    )
  );

CREATE POLICY "Participants can upload attachments"
  ON public.marketplace_job_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
  );

CREATE POLICY "Admins can manage attachments"
  ON public.marketplace_job_attachments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Phase 6: P2 OAuth/System Tables  
-- =====================================================

-- 15. oauth_states - No user_id, but system table. Allow authenticated users to manage states by platform
CREATE POLICY "Authenticated users can manage oauth states"
  ON public.oauth_states FOR ALL
  USING (auth.role() = 'authenticated');
