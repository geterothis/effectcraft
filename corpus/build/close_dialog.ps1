# Close a modal dialog of the background AE station by window title (WM_CLOSE).
param([string]$Title, [int]$ProcId)
Add-Type @"
using System;using System.Text;using System.Collections.Generic;using System.Runtime.InteropServices;
public class DlgClose{
 public delegate bool EP(IntPtr h,IntPtr l);
 [DllImport("user32.dll")]public static extern bool EnumWindows(EP f,IntPtr l);
 [DllImport("user32.dll")]public static extern int GetWindowThreadProcessId(IntPtr h,out int p);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)]public static extern int GetWindowText(IntPtr h,StringBuilder s,int n);
 [DllImport("user32.dll")]public static extern bool PostMessage(IntPtr h,uint m,IntPtr w,IntPtr l);
 public static List<string> Close(string title,int pid){
  var r=new List<string>();
  EnumWindows((h,l)=>{int p;GetWindowThreadProcessId(h,out p);if(p==pid){var s=new StringBuilder(256);GetWindowText(h,s,256);if(s.ToString().Contains(title)){PostMessage(h,0x0010,IntPtr.Zero,IntPtr.Zero);r.Add(h+" "+s);}}return true;},IntPtr.Zero);
  return r;}
}
"@
[DlgClose]::Close($Title, $ProcId)
