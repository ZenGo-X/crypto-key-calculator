/*
Input Format:
n
(p_safe, p_leak, p_lost, p_stolen)_1
(p_safe, p_leak, p_lost, p_stolen)_2
...
(p_safe, p_leak, p_lost, p_stolen)_n

Output Format:
Number of Selected Keys and their IDs
Best success probability found
Best pattern (2^n lines for accept/reject of each state)

Efficiency:
12 secs for 8 keys
22 secs for 16 keys

Strategy:
Iterate over all C(n,5) possibilities to select 5 keys,
and compare the result with that of 6 keys with highest p_safe.
Then output the most optimal one.
*/


#include <stdio.h>
#include <string.h>
#include <utility>
#include <algorithm>
#define ull unsigned long long
using namespace std;

double key[205][5];

struct node{
	int id;
	double val;
}u[205];

inline bool cmp(node a,node b){
	return a.val>b.val;
}

struct five_keys{
	
	double p[5][5],prb[33][33];
	int ac[33],rj[33],n,num;
	ull st_set[8005];
	
	void enumerate(int cur,ull sta){
		if (cur==(1<<n)){
			st_set[++num]=sta;
			return;
		}
		int tag=0;
		for (int i=0;i<n;i++){
			if ((cur&(1<<i))&&(sta&(1ull<<(cur^(1<<i))))){
				tag=1;
				break;
			}
		}
		sta|=(1ull<<cur);
		enumerate(cur+1,sta);
		if (!tag){
			sta^=(1ull<<cur);
			enumerate(cur+1,sta);
		}
	}
	
	void init(){
		n=5;
		enumerate(0,0);
	}
	
	pair<double,ull> check_res(){
		
		double maxn=-1.0;
		
		memset(prb,0,sizeof(prb));
		
		for (int i=0;i<(1<<(2*n));i++){
			int na=0,nb=0;
			double prob=1.0;
			for (int j=0;j<2*n;j+=2){
				int sta=0;
				if (i&(1<<j)){
					sta|=1;
				}
				if (i&(1<<(j+1))){
					sta|=2;
				}
				if (sta==0||sta==1){
					na|=(1<<(j>>1));
				}
				if (sta==1||sta==3){
					nb|=(1<<(j>>1));
				}
				prob*=p[(j>>1)][sta];
			}
			prb[na][nb]+=prob;
		}
		
		ull pattern=0;
		
		for (int i=1;i<=num;i++){
			int n1=0,n2=0;
			for (int j=0;j<(1<<n);j++){
				if (st_set[i]&(1ull<<j)){
					ac[++n1]=j;
				}
				else{
					rj[++n2]=j;
				}
			}
			double ans=0.0;
			for (int j=1;j<=n1;j++){
				for (int k=1;k<=n2;k++){
					ans+=prb[ac[j]][rj[k]];
				}
			}
			if (ans>maxn){
				maxn=ans;
				pattern=st_set[i];
			}
		}
		
		return make_pair(maxn,pattern);
	}
	
	void print(double maxn, ull pattern){
		
		printf ("Best Probability: %.6lf\n",maxn);
		printf ("Best Boolean Pattern:\n");
		
		for (int i=0;i<(1<<n);i++){
			for (int j=0;j<n;j++){
				if (i&(1<<j)){
					putchar('1');
				}
				else{
					putchar('0');
				}
			}
			putchar(':');
			putchar(' ');
			if (pattern&(1ull<<i)){
				puts("Accept");
			}
			else{
				puts("Reject");
			}
		}
	}
	
}T;

struct six_keys{
	
	double p[7][5],prb[65][65];
	int ac[65],rj[65],n,num;
	ull st_set[8000005];

	void enumerate(int cur,ull sta){
		if (cur==(1<<n)){
			st_set[++num]=sta;
			return;
		}
		int tag=0;
		for (int i=0;i<n;i++){
			if ((cur&(1<<i))&&(sta&(1ull<<(cur^(1<<i))))){
				tag=1;
				break;
			}
		}
		sta|=(1ull<<cur);
		enumerate(cur+1,sta);
		if (!tag){
			sta^=(1ull<<cur);
			enumerate(cur+1,sta);
		}
	}
	
	void init(){
		n=6;
		enumerate(0,0);
	}
	
	pair<double,ull> check_res(){
		
		double maxn=-1.0;
		
		memset(prb,0,sizeof(prb));
		
		for (int i=0;i<(1<<(2*n));i++){
			int na=0,nb=0;
			double prob=1.0;
			for (int j=0;j<2*n;j+=2){
				int sta=0;
				if (i&(1<<j)){
					sta|=1;
				}
				if (i&(1<<(j+1))){
					sta|=2;
				}
				if (sta==0||sta==1){
					na|=(1<<(j>>1));
				}
				if (sta==1||sta==3){
					nb|=(1<<(j>>1));
				}
				prob*=p[(j>>1)][sta];
			}
			prb[na][nb]+=prob;
		}
		
		ull pattern=0;
		
		for (int i=1;i<=num;i++){
			int n1=0,n2=0;
			for (int j=0;j<(1<<n);j++){
				if (st_set[i]&(1ull<<j)){
					ac[++n1]=j;
				}
				else{
					rj[++n2]=j;
				}
			}
			double ans=0.0;
			for (int j=1;j<=n1;j++){
				for (int k=1;k<=n2;k++){
					ans+=prb[ac[j]][rj[k]];
				}
			}
			if (ans>maxn){
				maxn=ans;
				pattern=st_set[i];
			}
		}
		
		return make_pair(maxn,pattern);
	}
	
	void print(double maxn, ull pattern){
		
		printf ("Best Probability: %.6lf\n",maxn);
		printf ("Best Boolean Pattern:\n");
		
		for (int i=0;i<(1<<n);i++){
			for (int j=0;j<n;j++){
				if (i&(1<<j)){
					putchar('1');
				}
				else{
					putchar('0');
				}
			}
			putchar(':');
			putchar(' ');
			if (pattern&(1ull<<i)){
				puts("Accept");
			}
			else{
				puts("Reject");
			}
		}
	}
}S;

int main (){
	
	double mp=-1;
	ull best_pat;
	int p1,p2,p3,p4,p5,n;
	
	scanf ("%d",&n);
	
	for (int i=1;i<=n;i++){
		for (int j=0;j<4;j++){
			int x;
			scanf ("%d",&x);
			key[i][j]=0.01*x;
		}
	}
	
	T.init();
	S.init();
	
	for (int t1=1;t1<=n;t1++){
		for (int t2=t1+1;t2<=n;t2++){
			for (int t3=t2+1;t3<=n;t3++){
				for (int t4=t3+1;t4<=n;t4++){
					for (int t5=t4+1;t5<=n;t5++){
						memcpy(T.p[0],key[t1],sizeof(key[t1]));
						memcpy(T.p[1],key[t2],sizeof(key[t2]));
						memcpy(T.p[2],key[t3],sizeof(key[t3]));
						memcpy(T.p[3],key[t4],sizeof(key[t4]));
						memcpy(T.p[4],key[t5],sizeof(key[t5]));
						pair<double,ull> res=T.check_res();
						double maxn=res.first;
						ull pattern=res.second;
						if (maxn>mp){
						 	mp=maxn;
						 	best_pat=pattern;
						 	p1=t1;
						 	p2=t2;
						 	p3=t3;
						 	p4=t4;
						 	p5=t5;
						}
					}
				}
			}
		}
	}
	
	for (int i=1;i<=n;i++){
		u[i].id=i;
		u[i].val=key[i][0];
	}
	sort(u+1,u+n+1,cmp);
	
	for (int i=0;i<6;i++){
		memcpy(S.p[i],key[u[i+1].id],sizeof(key[u[i+1].id]));
	}
	pair<double,ull> res=S.check_res();
	double maxn=res.first;
	ull pattern=res.second;
	if (maxn>mp){
		puts ("6 keys are chosen.\n"); 
		printf ("Their IDs are: ");
		for (int i=1;i<=6;i++){
			printf ("%d ",u[i].id);
		}
		puts("");
		S.print(maxn,pattern);
	}
	else{
		puts ("5 keys are chosen.\n"); 
		printf ("Their IDs are: ");
		printf ("%d %d %d %d %d\n",p1,p2,p3,p4,p5);
		T.print(mp,best_pat);
	}
	return 0;
	
}
	
/*
6
90 10 0 0
50 30 20 0
40 40 10 10
80 0 0 20
70 15 5 10
70 5 10 15

emcc wallet_gen_approx.cpp -O3 -o wallet_gen_approx.wasm -s TOTAL_MEMORY=134217728
*/
	
	

