import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Save, Check, ShieldCheck } from 'lucide-react';
import { getSession } from '../../lib/auth';
import { api } from '../../lib/api';

interface ProfileSectionProps {
  roleLabel: string;
  isAdmin?: boolean;
}

export function ProfileSection({ roleLabel, isAdmin = false }: ProfileSectionProps) {
  const session = getSession();
  const userId = session?.id;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPwdVerified, setCurrentPwdVerified] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      api.get(`/users/${userId}`)
        .then((data) => {
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
        })
        .finally(() => setLoading(false));
    }
  }, [userId]);

  const handleSaveProfile = async () => {
    try {
      await api.patch(`/users/${userId}`, { name, phone });
      setProfileSaved(true);
      toast.success('Profile updated successfully');
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleVerifyPwd = async () => {
    try {
      await api.post('/auth/verify-password', { password: currentPwd });
      setCurrentPwdVerified(true);
      toast.success('Password verified');
    } catch (err) {
      toast.error('Incorrect password');
    }
  };

  const handleSavePassword = async () => {
    if (newPwd !== confirmPwd) return toast.error('Passwords do not match');
    try {
      await api.patch(`/users/${userId}/password`, { password: newPwd });
      setPwdSaved(true);
      toast.success('Password changed');
      setNewPwd('');
      setConfirmPwd('');
      setCurrentPwd('');
      setCurrentPwdVerified(false);
      setTimeout(() => setPwdSaved(false), 2000);
    } catch (err) {
      toast.error('Failed to change password');
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-800 rounded-xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-white font-bold text-lg mb-6">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input type="email" value={email} disabled className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm opacity-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <input type="text" value={roleLabel} disabled className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm opacity-50" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveProfile} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg">
            {profileSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {profileSaved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-white font-bold text-lg mb-6">Change Password</h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Current Password</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => { setCurrentPwd(e.target.value); setCurrentPwdVerified(false); }}
                  disabled={currentPwdVerified}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {currentPwdVerified ? (
                <div className="flex items-center gap-1.5 px-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  <ShieldCheck className="w-4 h-4" /> Verified
                </div>
              ) : (
                <button onClick={handleVerifyPwd} className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg">Verify</button>
              )}
            </div>
          </div>

          {currentPwdVerified && (
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>
        {currentPwdVerified && (
          <div className="flex justify-end">
            <button onClick={handleSavePassword} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg">
              {pwdSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {pwdSaved ? 'Saved' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}