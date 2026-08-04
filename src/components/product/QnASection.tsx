'use client';

import { useState } from 'react';
import { getProductQnA } from '@/lib/mockSocialProof';
import { PrimaryButton, Accordion } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  productId: string;
}

export default function QnASection({ productId }: Props) {
  const qnas = getProductQnA(productId);
  const [showAskForm, setShowAskForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQnas = qnas.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (q.answer && q.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="py-12 border-t border-border">
      <div className="flex flex-col md:flex-row gap-12">
        
        {/* Q&A Header & Actions */}
        <div className="w-full md:w-1/3">
          <h2 className="text-2xl font-bold text-foreground mb-4">Questions & Answers</h2>
          <p className="text-text-muted text-sm mb-6">Have a question about this product? Ask the community and our store team.</p>
          
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Search questions..." 
              className="w-full bg-surface border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <PrimaryButton 
              className="w-full py-3"
              onClick={() => setShowAskForm(!showAskForm)}
            >
              {showAskForm ? 'Cancel' : 'Ask a Question'}
            </PrimaryButton>

            <AnimatePresence>
              {showAskForm && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border border-border rounded-xl bg-surface mt-2">
                    <textarea 
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm mb-4 min-h-[100px] focus:outline-none focus:border-accent" 
                      placeholder="What would you like to know?"
                    ></textarea>
                    <PrimaryButton className="w-full py-2 text-sm">Post Question</PrimaryButton>
                    <p className="text-xs text-text-muted text-center mt-3">Answers generally arrive within 24 hours.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Q&A List */}
        <div className="w-full md:w-2/3">
          {filteredQnas.length === 0 ? (
            <div className="text-center py-12 text-text-muted bg-surface rounded-xl border border-border border-dashed">
              <p>{searchQuery ? 'No questions match your search.' : 'No questions yet. Be the first to ask!'}</p>
            </div>
          ) : (
            <div className="bg-surface rounded-xl p-4 md:p-8 border border-border">
              <Accordion 
                items={filteredQnas.map(qna => ({
                  id: qna.id,
                  title: `Q: ${qna.question}`,
                  content: (
                    <div className="pt-2">
                      <p className="text-xs text-text-muted mb-4 border-b border-border/50 pb-4">
                        Asked by {qna.asker} on {new Date(qna.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      
                      {qna.answer ? (
                        <div className="flex gap-4">
                          <div className="font-bold text-lg text-text-muted">A:</div>
                          <div className="flex-1">
                            <p className="text-sm text-text-muted leading-relaxed">{qna.answer}</p>
                            <p className="text-xs text-text-muted mt-2 font-medium">Answered by {qna.responder}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <div className="font-bold text-lg text-text-muted">A:</div>
                          <div className="flex-1">
                            <p className="text-sm text-text-muted italic">No answers yet.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
